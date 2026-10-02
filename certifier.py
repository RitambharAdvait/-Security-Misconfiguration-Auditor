"""
ASArP Cryptographic Attestation & Anti-TOCTOU Certification Module
Based on Section 6 of "Automated Security Assessment & Audit of Remote Platforms
using TCG-SCAP synergies" (Aslam et al., Elsevier JISA 2015).

Provides:
- RSA-2048 / SHA-256 Asymmetric Key Generation & Management
- Deterministic JSON Canonicalization of Audit Findings
- Digital Signing of Audit Records (Anti-TOCTOU Seal)
- Independent Cryptographic Verification & Tamper Detection
"""

import os
import json
import base64
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Tuple, Optional

from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

# Paths
BASE_DIR = Path(__file__).parent
CERTS_DIR = BASE_DIR / "certs"
PRIVATE_KEY_PATH = CERTS_DIR / "asarp_private_key.pem"
PUBLIC_KEY_PATH = CERTS_DIR / "asarp_public_key.pem"


def init_keypair() -> Tuple[rsa.RSAPrivateKey, rsa.RSAPublicKey]:
    """
    Ensure the ASArP Platform Attestation Keypair exists in certs/.
    Generates a new RSA-2048 keypair if not already present.
    Simulates the hardware-bound Attestation Identity Key (AIK) / Bind Key.
    """
    CERTS_DIR.mkdir(parents=True, exist_ok=True)

    if PRIVATE_KEY_PATH.exists() and PUBLIC_KEY_PATH.exists():
        with open(PRIVATE_KEY_PATH, "rb") as f:
            private_key = serialization.load_pem_private_key(f.read(), password=None)
        with open(PUBLIC_KEY_PATH, "rb") as f:
            public_key = serialization.load_pem_public_key(f.read())
        return private_key, public_key

    # Generate new RSA-2048 keypair
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )
    public_key = private_key.public_key()

    # Save private key (PEM PKCS#8)
    with open(PRIVATE_KEY_PATH, "wb") as f:
        f.write(
            private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
        )

    # Save public key (PEM SubjectPublicKeyInfo)
    with open(PUBLIC_KEY_PATH, "wb") as f:
        f.write(
            public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
        )

    return private_key, public_key


def canonicalize_audit(record: Dict[str, Any]) -> bytes:
    """
    Produce a deterministic, whitespace-normalized byte representation of the audit record.
    Strips any existing 'attestation_seal' to ensure reproducible hashing.
    """
    payload = {k: v for k, v in record.items() if k != "attestation_seal"}
    # Sort keys recursively
    canonical_json = json.dumps(payload, sort_keys=True, separators=(',', ':'), ensure_ascii=True)
    return canonical_json.encode("utf-8")


def sign_audit_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate an immutable SHA-256 digest and RSA-PSS digital signature over the audit findings.
    Attaches the 'attestation_seal' block directly to the record.
    """
    private_key, public_key = init_keypair()
    canonical_bytes = canonicalize_audit(record)

    # 1. Compute SHA-256 Digest
    sha256_digest = hashlib.sha256(canonical_bytes).hexdigest()

    # 2. Asymmetric RSA-PSS Digital Signature
    signature = private_key.sign(
        canonical_bytes,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    signature_b64 = base64.b64encode(signature).decode("utf-8")

    # 3. Export Public Key PEM for independent verification
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode("utf-8")

    attestation_seal = {
        "sha256_hash": sha256_digest,
        "signature": signature_b64,
        "algorithm": "RSA-PSS-SHA256",
        "public_key_pem": public_pem,
        "signed_at": datetime.now().isoformat(),
        "verified": True,
        "signer": "ASArP Platform Root of Trust (TCB-Sealed Key)"
    }

    record["attestation_seal"] = attestation_seal
    return record


def verify_audit_record(record: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Verify the cryptographic integrity of an audit record.
    Re-computes the canonical SHA-256 hash and verifies the RSA-PSS signature.

    Returns:
        (is_valid: bool, status_message: str, details: dict)
    """
    seal = record.get("attestation_seal")
    if not seal:
        return False, "Audit record lacks an attestation seal.", {}

    expected_hash = seal.get("sha256_hash")
    signature_b64 = seal.get("signature")
    public_pem = seal.get("public_key_pem")

    if not expected_hash or not signature_b64 or not public_pem:
        return False, "Incomplete attestation seal metadata.", {}

    # 1. Recompute canonical digest
    canonical_bytes = canonicalize_audit(record)
    computed_hash = hashlib.sha256(canonical_bytes).hexdigest()

    details = {
        "expected_hash": expected_hash,
        "computed_hash": computed_hash,
        "algorithm": seal.get("algorithm", "RSA-PSS-SHA256"),
        "signed_at": seal.get("signed_at"),
        "signer": seal.get("signer")
    }

    # Hash comparison
    if computed_hash != expected_hash:
        return False, "HASH MISMATCH: Audit findings have been altered post-signature (TOCTOU violation detected).", details

    # 2. Cryptographic RSA Signature Verification
    try:
        public_key = serialization.load_pem_public_key(public_pem.encode("utf-8"))
        signature = base64.b64decode(signature_b64)
        public_key.verify(
            signature,
            canonical_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True, "CRYPTOGRAPHICALLY AUTHENTIC: Signature verified untampered.", details
    except Exception as e:
        return False, f"SIGNATURE VERIFICATION FAILED: {str(e)}", details

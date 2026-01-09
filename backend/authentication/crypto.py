# backend/authentication/crypto.py
import os
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
import base64

# File path to store the key locally
KEY_FILE = 'private.pem'

private_key = None
public_key = None

def load_keys():
    global private_key, public_key
    
    # 1. Try to load existing key from file
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "rb") as f:
            private_key = serialization.load_pem_private_key(
                f.read(),
                password=None
            )
    else:
        # 2. Generate new key if none exists
        print("Generating new RSA Key Pair...")
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        # Save it to file
        pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        with open(KEY_FILE, "wb") as f:
            f.write(pem)
            
    public_key = private_key.public_key()

# Load keys immediately when module is imported
load_keys()

def get_public_key_pem():
    pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return pem.decode('utf-8')

def decrypt_password(encrypted_b64_string):
    try:
        encrypted_bytes = base64.b64decode(encrypted_b64_string)
        original_message = private_key.decrypt(
            encrypted_bytes,
            padding.PKCS1v15()
        )
        return original_message.decode('utf-8')
    except Exception as e:
        print(f"Decryption Error: {e}")
        return None
"""
Dependencies: Database connections, encryption, and shared utilities.
"""
import os
from typing import Optional
import asyncpg
from pydantic_settings import BaseSettings
from contextlib import asynccontextmanager
import nacl.secret
import nacl.utils
import base64


class Settings(BaseSettings):
    """Application settings from environment variables."""
    database_url: str
    app_base_url: str = "http://localhost:8000"
    frontend_base_url: str = "http://localhost:3000"
    oauth_redirect_uri: str = "http://localhost:8000/auth/youtube/callback"
    encryption_key: str = "0000000000000000000000000000000000000000000000000000000000000000"
    ytdlp_bin: str = "yt-dlp"
    ffmpeg_bin: str = "ffmpeg"
    temp_dir: str = "/tmp"
    # Optional authentication for yt-dlp when YouTube requires cookies
    ytdlp_cookies_file: str = ""
    ytdlp_cookies_from_browser: str = ""
    worker_poll_interval: int = 60
    worker_batch_size: int = 5
    upload_visibility: str = "unlisted"
    max_retries: int = 3
    # Temporary Google credentials
    temp_client_id: str = ""
    temp_client_secret: str = ""

    class Config:
        env_file = ".env"


settings = Settings()

# Debug: Print all environment variables
import os
print(f"DEBUG: All env vars starting with 'temp':")
for key, value in os.environ.items():
    if key.lower().startswith('temp'):
        print(f"  {key} = {value}")
print(f"DEBUG: temp_client_id from settings: {getattr(settings, 'temp_client_id', 'NOT_FOUND')}")
print(f"DEBUG: temp_client_secret from settings: {getattr(settings, 'temp_client_secret', 'NOT_FOUND')}")

# Database connection pool (global)
db_pool: Optional[asyncpg.Pool] = None


async def get_db_pool() -> asyncpg.Pool:
    """Get or create the database connection pool."""
    global db_pool
    if db_pool is None:
        db_pool = await asyncpg.create_pool(
            settings.database_url,
            min_size=2,
            max_size=10,
            command_timeout=60,
            statement_cache_size=0  # Required for Supabase pgbouncer in transaction mode
        )
    return db_pool


async def close_db_pool():
    """Close the database connection pool."""
    global db_pool
    if db_pool:
        await db_pool.close()
        db_pool = None


@asynccontextmanager
async def get_db():
    """Get a database connection from the pool."""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        yield conn


# Encryption utilities using libsodium (NaCl)
class Crypto:
    """Encryption/decryption for sensitive data."""
    
    def __init__(self):
        key_bytes = bytes.fromhex(settings.encryption_key)
        self.box = nacl.secret.SecretBox(key_bytes)
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt a string and return base64-encoded ciphertext."""
        encrypted = self.box.encrypt(plaintext.encode('utf-8'))
        return base64.b64encode(encrypted).decode('utf-8')
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt base64-encoded ciphertext and return plaintext."""
        encrypted = base64.b64decode(ciphertext.encode('utf-8'))
        decrypted = self.box.decrypt(encrypted)
        return decrypted.decode('utf-8')


crypto = Crypto()


def encrypt_field(value: str) -> str:
    """Encrypt a field value."""
    # Temporarily disabled for testing - TODO: Re-enable encryption
    return value
    # return crypto.encrypt(value)


def decrypt_field(value: str) -> str:
    """Decrypt a field value."""
    # Temporarily disabled for testing - TODO: Re-enable encryption
    try:
        return value
    except:
        # If value is already bytes/encrypted, return a placeholder
        return "PLACEHOLDER_TOKEN"
    # return crypto.decrypt(value)


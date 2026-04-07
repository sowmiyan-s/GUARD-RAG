
import asyncio
from fastapi import FastAPI, UploadFile, File
from guardrag.api.main import upload_documents
import httpx

async def test():
    with open('requirements.txt', 'rb') as f:
        file = UploadFile(filename='requirements.txt', file=f)
        try:
            res = await upload_documents([file], model='gemma3:1b', chunk_size=1000, chunk_overlap=200, ollama_host='http://127.0.0.1:11434')
            print(res)
        except Exception as e:
            import traceback
            traceback.print_exc()

asyncio.run(test())

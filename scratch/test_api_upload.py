import asyncio
from fastapi import UploadFile
from io import BytesIO
from guardrag.api.main import upload_documents

async def run_test():
    # Create a mock UploadFile
    file_content = b"Hello world from GuardRAG test! This is a simple test document to check if the RAG index builds successfully."
    file_obj = BytesIO(file_content)
    mock_file = UploadFile(filename="test.txt", file=file_obj)
    
    # Call upload_documents
    result = await upload_documents(
        files=[mock_file],
        model="gemma3:1b",
        chunk_size=1000,
        chunk_overlap=200,
        ollama_host="http://localhost:11434"
    )
    print("Result:", result)

if __name__ == "__main__":
    asyncio.run(run_test())

import asyncio
from fastapi import UploadFile
from io import BytesIO
from guardrag.api.main import upload_documents

async def run_test():
    # Minimal valid PDF structure with test text inside
    pdf_content = (
        b'%PDF-1.4\n'
        b'1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
        b'2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
        b'3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>\nendobj\n'
        b'4 0 obj\n<< /Length 125 >>\nstream\n'
        b'BT\n/F1 12 Tf\n72 712 Td\n(Hello from GuardRAG PDF Test! This is a simple test document to check if the PDF index builds successfully.) Tj\nET\n'
        b'endstream\nendobj\n'
        b'xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000236 00000 n \n'
        b'trailer\n<< /Size 5 /Root 1 0 R >>\n'
        b'startxref\n336\n%%EOF\n'
    )
    
    file_obj = BytesIO(pdf_content)
    mock_file = UploadFile(filename="test.pdf", file=file_obj)
    
    print("Uploading mock PDF to RAG engine...")
    result = await upload_documents(
        files=[mock_file],
        model="qwen2.5:3b",
        chunk_size=1000,
        chunk_overlap=200,
        ollama_host="http://localhost:11434"
    )
    print("Result:", result)

if __name__ == "__main__":
    asyncio.run(run_test())

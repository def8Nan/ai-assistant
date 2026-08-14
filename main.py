import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from starlette.requests import Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from logger_setup import setup_chat_logger, log_chat_interaction
from rag_agent import RAGAgent

app = FastAPI(title="AI Chat API", version="1.0")
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

chat_logger = setup_chat_logger("chat_history.jsonl")
rag_agent = RAGAgent(db_path="./chroma_db", collection_name="faq_collection")
rag_agent.init_knowledge_base(json_file="faq.json", hash_file="faq_hash.txt")


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)


@app.post("/chat")
@limiter.limit("5/minute")
async def chat_endpoint(request: Request, chat_data: ChatRequest):
    if not chat_data.message.strip():
        raise HTTPException(status_code=400, detail="Сообщение не может содержать только пробелы")

    try:
        context, source_url = rag_agent.find_relevant_context(chat_data.message)
        answer_stream = rag_agent.generate_answer_stream(chat_data.message, context, source_url)

        async def stream_with_logging():
            full_answer = ""
            try:
                for chunk in answer_stream:
                    if await request.is_disconnected():
                        break

                    full_answer += chunk
                    yield f"data: {json.dumps({'text': chunk}, ensure_ascii=False)}\n\n"

                yield "data: [DONE]\n\n"

                if full_answer.strip():
                    log_chat_interaction(chat_logger, chat_data.message, full_answer)

            except Exception as e:
                if "disconnect" in str(e).lower() or "socket" in str(e).lower():
                    pass
                else:
                    raise

        return StreamingResponse(
            stream_with_logging(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")
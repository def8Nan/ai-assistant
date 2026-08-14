from pathlib import Path
import json
import logging
from datetime import datetime
from logging.handlers import RotatingFileHandler

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).strftime("%Y-%m-%d %H:%M:%S"),
            "question": record.question if hasattr(record, 'question') else None,
            "answer": record.answer if hasattr(record, 'answer') else None
        }
        return json.dumps(log_entry, ensure_ascii=False)


class JsonlRotatingFileHandler(RotatingFileHandler):
    def doRollover(self):
        if self.stream:
            self.stream.close()
            self.stream = None

        if self.backupCount > 0:
            base_path = Path(self.baseFilename)
            base_name = base_path.stem
            extension = base_path.suffix
            parent_dir = base_path.parent

            for i in range(self.backupCount - 1, 0, -1):
                source_file = parent_dir / f"{base_name}.{i}{extension}"
                dest_file = parent_dir / f"{base_name}.{i + 1}{extension}"

                if source_file.exists():
                    if dest_file.exists():
                        dest_file.unlink()
                    source_file.rename(dest_file)

            dest_file = parent_dir / f"{base_name}.1{extension}"
            if dest_file.exists():
                dest_file.unlink()
            base_path.rename(dest_file)

        self.stream = self._open()


def setup_chat_logger(log_file="chat_history.jsonl"):
    logger = logging.getLogger("chat_logger")
    logger.setLevel(logging.INFO)

    if logger.handlers:
        return logger

    handler = JsonlRotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding='utf-8'
    )

    handler.setFormatter(JSONFormatter())
    logger.addHandler(handler)

    return logger


def log_chat_interaction(logger, question, answer):
    log_record = logger.makeRecord(
        name=logger.name,
        level=logging.INFO,
        fn="",
        lno=0,
        msg="Chat interaction",
        args=(),
        exc_info=None
    )

    log_record.question = question
    log_record.answer = answer
    logger.handle(log_record)
import os
import glob
import json
import re
import math
import random
from typing import List, Dict, Any, Optional

# Default path to the Data directory
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "Data"))

class KnowledgeBase:
    """
    Curriculum Knowledge Base & Retrieval-Augmented Generation (RAG) Engine.
    Loads and indexes structured textbook chunks from every .json/.txt file in the Data directory
    (currently: Class X Science, Chapter 1 - Laws of Motion).
    """

    def __init__(self, data_dir: str = DATA_DIR):
        self.data_dir = data_dir
        self.chunks: List[Dict[str, Any]] = []
        self.doc_lengths: List[int] = []
        self.avg_doc_length: float = 0.0
        self.inverted_index: Dict[str, List[tuple]] = {}  # term -> list of (doc_idx, tf)
        self.doc_count: int = 0
        self.is_ready: bool = False

        self.load_and_index()

    def _tokenize(self, text: str) -> List[str]:
        """Simple, fast lowercase alphanumeric tokenizer."""
        if not text:
            return []
        # Split on non-alphanumeric characters, keeping tokens of length >= 2
        return [t for t in re.findall(r'[a-zA-Z0-9_\u0B80-\u0BFF]+', text.lower()) if len(t) > 1]

    def _parse_file(self, file_path: str) -> List[Dict[str, Any]]:
        """Parse JSON or structured text files containing chunk objects."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:
                    return []

                # If the content starts with array brackets
                if content.startswith("[") and content.endswith("]"):
                    return json.loads(content)

                # If text contains consecutive JSON objects or starts with '{'
                if content.startswith("{"):
                    # Wrap into list if needed
                    fixed_content = "[" + content.rstrip(",") + "]"
                    try:
                        return json.loads(fixed_content)
                    except Exception:
                        pass

                # Fallback regex extraction of JSON objects
                extracted = []
                for match in re.finditer(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', content):
                    try:
                        obj = json.loads(match.group(0))
                        if "content" in obj or "topic" in obj:
                            extracted.append(obj)
                    except Exception:
                        continue
                if extracted:
                    return extracted

                # Try wrapping whatever is inside
                return json.loads(content)
        except Exception as e:
            print(f"[WARN] Error reading {os.path.basename(file_path)}: {e}")
            return []

    def load_and_index(self):
        """Loads all .json and .txt files from Data directory and builds BM25 index."""
        if not os.path.exists(self.data_dir):
            print(f"[WARN] Data directory not found at: {self.data_dir}")
            return

        files = glob.glob(os.path.join(self.data_dir, "*.json")) + glob.glob(os.path.join(self.data_dir, "*.txt"))
        all_chunks = []
        seen_ids = set()

        for fpath in files:
            file_chunks = self._parse_file(fpath)
            for chunk in file_chunks:
                if not isinstance(chunk, dict):
                    continue
                # Unique identifier
                cid = chunk.get("chunk_id") or f"chunk_{len(all_chunks)}"
                if cid in seen_ids:
                    continue
                seen_ids.add(cid)

                # Ensure standard fields
                chunk["chunk_id"] = cid
                chunk["course_name"] = chunk.get("course_name", "Science - Class X")
                chunk["chapter_no"] = chunk.get("chapter_no", 0)
                chunk["unit_no"] = chunk.get("unit_no", 0)
                chunk["topic"] = chunk.get("topic", "")
                chunk["subtopic"] = chunk.get("subtopic", "")
                chunk["concept_type"] = chunk.get("concept_type", "Concept")
                chunk["keywords"] = chunk.get("keywords", [])
                chunk["content"] = chunk.get("content", "")

                all_chunks.append(chunk)

        self.chunks = all_chunks
        self.doc_count = len(self.chunks)

        if self.doc_count == 0:
            print(f"[WARN] No curriculum chunks loaded from {self.data_dir}")
            return

        # Build BM25 Index
        total_len = 0
        self.doc_lengths = []
        self.inverted_index = {}

        for idx, chunk in enumerate(self.chunks):
            # Create composite searchable text with weighted fields
            topic_tokens = self._tokenize(chunk.get("topic", "")) * 3
            subtopic_tokens = self._tokenize(chunk.get("subtopic", "")) * 3
            keywords_tokens = self._tokenize(" ".join(chunk.get("keywords", []))) * 4
            content_tokens = self._tokenize(chunk.get("content", ""))

            combined_tokens = topic_tokens + subtopic_tokens + keywords_tokens + content_tokens
            doc_len = len(combined_tokens)
            self.doc_lengths.append(doc_len)
            total_len += doc_len

            # Term frequencies
            tf_map = {}
            for t in combined_tokens:
                tf_map[t] = tf_map.get(t, 0) + 1

            for t, tf in tf_map.items():
                if t not in self.inverted_index:
                    self.inverted_index[t] = []
                self.inverted_index[t].append((idx, tf))

        self.avg_doc_length = (total_len / self.doc_count) if self.doc_count > 0 else 1.0
        self.is_ready = True
        print(f"[INFO] Knowledge Base loaded successfully: {self.doc_count} curriculum chunks indexed from {len(files)} files.")

    def search(self, query: str, top_k: int = 3, min_score: float = 0.5, chapter_no: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Search for most relevant curriculum chunks using BM25 scoring algorithm.
        """
        if not self.is_ready or not query or self.doc_count == 0:
            return []

        tokens = self._tokenize(query)
        if not tokens:
            return []

        # BM25 Parameters
        k1 = 1.5
        b = 0.75
        scores = {}

        for token in tokens:
            if token not in self.inverted_index:
                continue

            postings = self.inverted_index[token]
            df = len(postings)
            # IDF with smoothing
            idf = math.log(1 + (self.doc_count - df + 0.5) / (df + 0.5))

            for doc_idx, tf in postings:
                # Chapter filtering if specified
                if chapter_no is not None and self.chunks[doc_idx].get("chapter_no") != chapter_no:
                    continue

                doc_len = self.doc_lengths[doc_idx]
                numerator = tf * (k1 + 1)
                denominator = tf + k1 * (1 - b + b * (doc_len / self.avg_doc_length))
                bm25_val = idf * (numerator / denominator)

                scores[doc_idx] = scores.get(doc_idx, 0.0) + bm25_val

        # Sort by score descending
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)

        results = []
        for doc_idx, score in ranked[:top_k]:
            if score < min_score:
                continue
            chunk = dict(self.chunks[doc_idx])
            chunk["relevance_score"] = round(score, 3)
            results.append(chunk)

        return results

    def get_random_concept(self) -> Optional[Dict[str, Any]]:
        """Selects a random curriculum concept suitable for quiz/question generation."""
        if not self.chunks:
            return None
        # Select chunk with reasonable content length
        valid = [c for c in self.chunks if len(c.get("content", "")) > 60 and c.get("topic")]
        return random.choice(valid) if valid else random.choice(self.chunks)

    def format_rag_context(self, chunks: List[Dict[str, Any]], max_chars: int = 2500) -> str:
        """Formats retrieved chunks into clear textbook context for LLM prompts."""
        if not chunks:
            return ""

        context_blocks = []
        total_len = 0

        for idx, chunk in enumerate(chunks, 1):
            ch_num = chunk.get("chapter_no", "")
            topic = chunk.get("topic", "")
            subtopic = chunk.get("subtopic", "")
            concept_type = chunk.get("concept_type", "")
            content = chunk.get("content", "").strip()
            keywords = ", ".join(chunk.get("keywords", []))

            header = f"[Textbook Resource #{idx} | Chapter {ch_num}: {topic}"
            if subtopic and subtopic != topic:
                header += f" - {subtopic}"
            if concept_type:
                header += f" ({concept_type})"
            header += "]"

            block = f"{header}\n{content}"
            if keywords:
                block += f"\nKey Terms: {keywords}"

            if total_len + len(block) > max_chars:
                break

            context_blocks.append(block)
            total_len += len(block)

        if not context_blocks:
            return ""

        return "\n\n---\n### OFFICIAL CURRICULUM & TEXTBOOK REFERENCE:\n" + "\n\n".join(context_blocks) + "\n---\n"


# Singleton instance
knowledge_base = KnowledgeBase()

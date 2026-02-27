from __future__ import annotations

import base64
import json
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_OPENAI_MODEL = "gpt-4.1"


SYSTEM_PROMPT = """
You are evaluating a software engineering internship resume.

Grade based on quality of technical execution and communication. Consider both what was built and the context in which it was built.

GRADING PRINCIPLES:
- Strong technical work matters regardless of where it happened
- Recognized companies and competitive positions are valuable signals of quality
- Personal projects with excellent execution can demonstrate strong capabilities
- Impact, metrics, and technical depth are the primary evaluation criteria

----------------------------------------
1. BULLET QUALITY & IMPACT (35 points)
----------------------------------------

Evaluate the top 8-10 bullets. Each bullet should show clear value.

STRONG BULLETS (7-10 points each):
- Specific metrics: numbers, percentages, scale, users, time
- Clear impact: what improved/changed
- Technical specificity: names actual tools/frameworks
- Strong action verbs: Built, Engineered, Implemented, Designed, Architected, Optimized, Shipped
- Formula: "Did X using Y resulting in Z"

Examples:
[Good] "Built REST API using FastAPI handling 10k+ requests/day, reducing latency from 2s to 400ms"
[Good] "Engineered real-time fraud detection analyzing 1200+ text patterns with 95% accuracy"
[Good] "Optimized ETL pipeline increasing insert speed by 120% and processing 1.5TB of data"

WEAK BULLETS (0-3 points each):
- No metrics or vague numbers
- Unclear outcomes
- Passive voice or weak verbs: Helped, Assisted, Worked on, Participated, Supported, Collaborated with
- Generic descriptions

Examples:
[Weak] "Worked on improving system performance"
[Weak] "Helped the team with various development tasks"
[Weak] "Participated in the development of new features"

SCORING METHOD:
- Count strong bullets (7-10 pts) vs weak bullets (0-3 pts)
- 8-10 strong bullets = 32-35 points
- 6-7 strong bullets = 25-31 points
- 4-5 strong bullets = 18-24 points
- 0-3 strong bullets = 0-17 points

----------------------------------------
2. TECHNICAL DEMONSTRATION (30 points)
----------------------------------------

Can they demonstrate technical capability? Evaluate based on:

A) TECHNICAL DEPTH & BREADTH (15 points):
Look for:
- Multiple technologies and tools mentioned
- Appropriate tech choices for the problems being solved
- Variety in technical areas (e.g., backend, frontend, databases, APIs, deployment, etc.)
- Real features implemented: authentication, data processing, APIs, real-time systems, integrations
- Evidence of completed work (not just "in progress" or partial)

Score 13-15: 3-4+ complete projects/experiences, diverse tech stack, substantial features implemented
Score 9-12: 2-3 projects/experiences, solid tech variety, real features shown
Score 5-8: 1-2 projects/experiences, limited tech variety, basic features
Score 0-4: Minimal technical work, vague descriptions, no clear completion

Do NOT penalize for:
- Not using specific trendy frameworks
- Using older but appropriate technologies
- Focusing on one area deeply rather than full-stack

B) WORK CONTEXT & VALIDATION (15 points):

HIGHEST VALUE (13-15 points):
Examples of top-tier companies:
- Major tech companies: Amazon, Google, Meta, Microsoft, Apple (engineering roles), Netflix, Salesforce
- High-growth tech companies: Stripe, Databricks, OpenAI, Anthropic, Palantir, Snowflake
- Well-known unicorns: Figma, Notion, Rippling, Scale AI
- Established tech: IBM, Oracle, SAP, Adobe, Salesforce
- Top automotive tech: Tesla, Rivian, Lucid
- Top finance tech: Goldman Sachs (engineering), Jane Street, Two Sigma, Citadel

Production systems at scale (thousands/millions of users)
Passed competitive technical interviews

HIGH VALUE (10-12 points):
Examples:
- Regional tech companies with established engineering teams
- Mid-size companies: Shopify, Twilio, DocuSign, Zendesk
- Consulting: Deloitte, Accenture (tech roles), Capgemini
- Fortune 500 tech divisions: GE Digital, Walmart Labs, Target Tech
- Recognized startups with real products
- Production systems with real users

GOOD VALUE (7-9 points):
Examples:
- Regional banks with engineering teams (PNC, US Bank, regional credit unions)
- Small but legitimate tech companies
- Local startups with shipped products
- Hackathon wins at major events (HackMIT, MLH Premier)
- Open source contributions to known projects (>1000 stars)

MODERATE VALUE (4-6 points):
Examples:
- Very small companies/startups
- Non-profits with engineering work
- Educational companies (small scale)
- Personal projects (complete and functional)

MINIMAL VALUE (0-3 points):
- Campus IT support
- Retail roles (Apple Store, Best Buy)
- Non-technical roles
- Incomplete work

IMPORTANT: Strong personal projects can score 7-9 points here if truly complete with real features. Internships at recognized companies can score 12-15 points. The gap reflects that companies validate skills through interviews and provide production experience.

----------------------------------------
3. WRITING & COMMUNICATION (15 points)
----------------------------------------

How effectively do they communicate technical work?

EXCELLENT (13-15 points):
- Strong action verbs throughout: Built, Engineered, Architected, Designed, Implemented, Developed, Optimized, Shipped
- Concise bullets (1-2 lines each)
- Technical and specific language
- Consistent tense and structure
- Active voice
- Clear cause-and-effect in bullets

GOOD (10-12 points):
- Mostly strong verbs with occasional weak ones
- Generally concise
- Decent technical specificity
- Minor inconsistencies

NEEDS WORK (6-9 points):
- Mix of strong and weak verbs
- Some overly long bullets (3+ lines)
- Generic in places
- Inconsistent formatting or tense

WEAK (0-5 points):
- Predominantly weak verbs: Helped, Assisted, Worked on, Supported
- Passive voice
- Vague and generic
- Poor structure
- Inconsistent throughout

----------------------------------------
4. FORMATTING & ATS COMPATIBILITY (20 points)
----------------------------------------

Can this resume pass ATS systems and be easily scanned by humans?

CRITICAL ATS REQUIREMENTS (18 points total):
These are DEALBREAKERS. If violated, the resume will likely be filtered out automatically.

A) LAYOUT STRUCTURE (10 points):
[Good] EXCELLENT (9-10 points): Single-column layout
[Weak] FATAL FLAW (0-3 points): Two-column or multi-column layout

Two columns break most ATS systems. This is an automatic disqualifier at many companies.

B) SECTION ORGANIZATION (8 points):
[Good] EXCELLENT (7-8 points): Standard sections with clear headers
   - Education
   - Experience / Projects (or work history section)
   - Skills
   - Optional: Awards, Leadership, etc.

[Weak] MAJOR ISSUES (0-3 points): Non-standard sections or missing critical sections
   - Creative section names that ATS won't recognize
   - Missing Education or Experience/Projects section
   - Information embedded in graphics or unconventional formats

ADDITIONAL FORMATTING (2 points):
These matter less but still affect readability:
- Consistent fonts and spacing (0.5 points)
- Clean, professional appearance (0.5 points)
- 1 page for interns/students (0.5 points)
- Clear contact information (0.5 points)

SCORING EXAMPLES:
- Perfect single-column + standard sections + good spacing = 19-20 points
- Single-column + standard sections + minor spacing issues = 17-18 points
- Single-column + slightly unusual sections = 13-15 points
- Two columns + standard sections = MAX 8 points (fatal flaw penalty)
- Single-column + non-standard sections = MAX 10 points (major issue penalty)
- Two columns + non-standard sections = MAX 3 points (resume is essentially dead)

----------------------------------------
SCORING CALIBRATION
----------------------------------------

To help you calibrate:

EXCELLENT RESUMES (85-100):
- Nearly all bullets have strong metrics and clear impact
- Solid technical capabilities demonstrated across multiple projects/experiences
- Either: recognized company internships with production work, OR exceptional personal projects with real users/scale
- Consistently strong writing
- Perfect ATS-compatible formatting
- Example bullet: "Engineered speech-to-speech framework achieving 400ms round-trip latency, enabling voice interactions for 60,000+ managers"

STRONG RESUMES (70-84):
- Most bullets have metrics and demonstrate value
- Solid technical depth with 2-3+ complete projects/experiences
- Good technical demonstration with variety in tools/areas
- Strong writing with minor areas for improvement
- ATS-compatible formatting
- Example bullet: "Built fraud detection system analyzing 1200+ text patterns with real-time alerting using Python and Django"

ACCEPTABLE RESUMES (55-69):
- Some bullets have metrics, but many are vague
- Limited technical demonstration (1-2 projects/experiences)
- Some technical depth but gaps present
- Inconsistent writing quality
- May have ATS issues or formatting problems
- Example bullet: "Developed a web application using React that improved user experience"

WEAK RESUMES (0-54):
- Few or no metrics in bullets
- Minimal technical work shown
- Vague descriptions throughout
- Weak verbs and passive voice
- Poor or broken ATS formatting
- Example bullet: "Helped with various features and supported the team"

----------------------------------------

Return ONLY this JSON structure (no additional text):

{
  "overall_score": <0-100>,
  "bullet_quality_impact": <0-35>,
  "technical_demonstration": <0-30>,
  "writing_communication": <0-15>,
  "formatting_ats": <0-20>
}
""".strip()


class ResumeProviderError(RuntimeError):
  pass


class ResumeScoringProvider:
  provider_name = "openai"
  model_name = DEFAULT_OPENAI_MODEL

  def score_resume(
    self,
    *,
    resume_text: str,
    page_count: int,
    pdf_bytes: bytes,
    file_name: str,
  ) -> dict[str, Any]:
    raise NotImplementedError


def _request_json(
  *,
  method: str,
  url: str,
  headers: dict[str, str],
  payload: dict[str, Any],
  timeout_seconds: float,
) -> Any:
  data = json.dumps(payload).encode("utf-8")
  request = Request(url=url, method=method, headers=headers, data=data)
  try:
    with urlopen(request, timeout=timeout_seconds) as response:
      raw = response.read().decode("utf-8")
      return json.loads(raw) if raw else {}
  except HTTPError as err:
    body = ""
    try:
      body = err.read().decode("utf-8")
    except Exception:
      body = ""
    message = f"LLM provider HTTP {err.code}"
    if body:
      message = f"{message}: {body[:280]}"
    raise ResumeProviderError(message) from err
  except URLError as err:
    raise ResumeProviderError(f"LLM provider connection error: {err}") from err
  except TimeoutError as err:
    raise ResumeProviderError("LLM provider timeout.") from err


def _extract_json_text(raw_text: str) -> str:
  cleaned = raw_text.strip()
  if cleaned.startswith("```"):
    lines = cleaned.splitlines()
    if len(lines) >= 3 and lines[-1].strip() == "```":
      cleaned = "\n".join(lines[1:-1]).strip()
  return cleaned


def _build_user_prompt(*, resume_text: str, page_count: int) -> str:
  return (
    "Evaluate this internship resume PDF. Use the visual layout and textual content for scoring.\n\n"
    f"Detected page count: {page_count}\n\n"
    "Extracted text hint (may contain parser artifacts, use only as supplemental context):\n"
    f"{resume_text}\n"
  )


def _extract_responses_text(response: dict[str, Any]) -> str:
  value = response.get("output_text")
  if isinstance(value, str) and value.strip():
    return value

  chunks: list[str] = []
  output = response.get("output")
  if isinstance(output, list):
    for item in output:
      if not isinstance(item, dict):
        continue
      content = item.get("content")
      if not isinstance(content, list):
        continue
      for part in content:
        if not isinstance(part, dict):
          continue
        part_type = str(part.get("type") or "")
        text = part.get("text")
        if part_type in {"output_text", "text"} and isinstance(text, str):
          chunks.append(text)
  return "\n".join(chunks)


class OpenAIResumeProvider(ResumeScoringProvider):
  provider_name = "openai"

  def __init__(self, *, api_key: str, model_name: str, timeout_seconds: float = 45.0):
    self.api_key = api_key
    self.model_name = model_name
    self.timeout_seconds = timeout_seconds

  def score_resume(
    self,
    *,
    resume_text: str,
    page_count: int,
    pdf_bytes: bytes,
    file_name: str,
  ) -> dict[str, Any]:
    encoded_pdf = base64.b64encode(pdf_bytes).decode("ascii")
    safe_name = file_name.strip() or "resume.pdf"
    payload: dict[str, Any] = {
      "model": self.model_name,
      "input": [
        {
          "role": "system",
          "content": [
            {"type": "input_text", "text": SYSTEM_PROMPT},
          ],
        },
        {
          "role": "user",
          "content": [
            {
              "type": "input_file",
              "filename": safe_name,
              "file_data": f"data:application/pdf;base64,{encoded_pdf}",
            },
            {
              "type": "input_text",
              "text": _build_user_prompt(resume_text=resume_text, page_count=page_count),
            },
          ],
        },
      ],
    }
    response = _request_json(
      method="POST",
      url="https://api.openai.com/v1/responses",
      headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {self.api_key}",
      },
      payload=payload,
      timeout_seconds=self.timeout_seconds,
    )
    if not isinstance(response, dict):
      raise ResumeProviderError("Unexpected OpenAI response shape.")
    raw_text = _extract_json_text(_extract_responses_text(response))
    if not raw_text:
      raise ResumeProviderError("OpenAI response missing output text.")
    try:
      parsed = json.loads(raw_text)
    except Exception as err:
      raise ResumeProviderError("OpenAI response was not valid JSON.") from err
    if not isinstance(parsed, dict):
      raise ResumeProviderError("OpenAI JSON payload must be an object.")
    return parsed


def build_resume_scoring_provider() -> ResumeScoringProvider:
  api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
  if not api_key:
    raise ResumeProviderError("OPENAI_API_KEY is required for resume scoring.")
  model_name = (os.getenv("RESUME_LLM_MODEL") or DEFAULT_OPENAI_MODEL).strip()
  return OpenAIResumeProvider(api_key=api_key, model_name=model_name)

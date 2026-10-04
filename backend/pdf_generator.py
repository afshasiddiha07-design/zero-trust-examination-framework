from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch


PDF_DIR = Path("generated_pdfs")
PDF_DIR.mkdir(exist_ok=True)


def generate_exam_pdf(exam_id: str, questions: list[dict]) -> str:
    file_path = PDF_DIR / f"exam_{exam_id}.pdf"

    document = SimpleDocTemplate(
        str(file_path),
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    story = []

    story.append(
        Paragraph(
            "ZERO-TRUST EXAMINATION FRAMEWORK",
            styles["Title"]
        )
    )

    story.append(
        Paragraph(
            f"Exam ID: {exam_id}",
            styles["Normal"]
        )
    )

    story.append(Spacer(1, 0.3 * inch))

    for index, question in enumerate(questions, start=1):
        story.append(
            Paragraph(
                f"{index}. {question['question_text']}",
                styles["Heading3"]
            )
        )

        story.append(
            Paragraph(f"A. {question['option_a']}", styles["Normal"])
        )
        story.append(
            Paragraph(f"B. {question['option_b']}", styles["Normal"])
        )
        story.append(
            Paragraph(f"C. {question['option_c']}", styles["Normal"])
        )
        story.append(
            Paragraph(f"D. {question['option_d']}", styles["Normal"])
        )

        story.append(Spacer(1, 0.2 * inch))

    document.build(story)

    return str(file_path)
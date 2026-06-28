from __future__ import annotations

import io
from datetime import date
from pathlib import Path
from urllib.parse import quote_plus

from app.pdf import PdfContent, build_pdf, draw_qr, qr_svg


LOGO_PATH = Path(__file__).resolve().parents[1] / "assets" / "lytix-logo-brand.png"
FOUNDER_NAME = "Sunil Kumar"
FOUNDER_TITLE = "Founder & CEO"
TAGLINE = "Learn. Build. Innovate."
VERIFICATION_PORTAL = "verify.lytixtechnologies.com"


def _safe(value: object, fallback: str = "Pending") -> str:
    return str(value) if value not in (None, "") else fallback


def build_offer_letter(application: dict, offer_letter_id: str, certificate_id: str | None) -> bytes:
    verification_url = application.get("verification_url") or "Certificate verification pending"
    try:
        return _reportlab_offer(application, offer_letter_id, certificate_id, verification_url)
    except Exception:
        return _fallback_offer(application, offer_letter_id, certificate_id, verification_url)


def build_certificate(application: dict, certificate_id: str, verification_url: str) -> bytes:
    try:
        return _reportlab_certificate(application, certificate_id, verification_url)
    except Exception:
        return _fallback_certificate(application, certificate_id, verification_url)


def build_experience_letter(
    application: dict,
    document_id: str,
    verification_url: str,
    work_summary: str,
    performance_rating: str,
) -> bytes:
    title = "Experience Letter"
    body = [
        f"This is to certify that {application['student']['name']} completed an internship with LYTIX TECHNOLOGIES in the {application['domain']['name']} domain.",
        f"The internship duration was from {_safe(application.get('start_date'))} to {_safe(application.get('end_date'))}.",
        f"Work Summary: {work_summary or 'Completed assigned internship tasks, LMS activities, project work, and professional updates.'}",
        f"Performance Rating: {performance_rating or 'Excellent'}",
        "We appreciate the student's contribution and wish them success in future professional work.",
    ]
    return _build_letter_document(application, document_id, verification_url, title, body)


def build_lor(
    application: dict,
    document_id: str,
    verification_url: str,
    performance_rating: str,
) -> bytes:
    title = "Letter of Recommendation"
    body = [
        f"LYTIX TECHNOLOGIES is pleased to recommend {application['student']['name']} for future technical and professional opportunities.",
        f"During the {application['domain']['name']} internship, the student demonstrated strong execution, timely delivery, and consistent ownership.",
        f"Performance Rating: {performance_rating or 'Outstanding'}",
        "The student met the top-performer criteria for attendance, assignment completion, and project performance.",
        "We recommend the student for roles and learning opportunities aligned with their demonstrated capabilities.",
    ]
    return _build_letter_document(application, document_id, verification_url, title, body)


def build_qr_svg(verification_url: str) -> str:
    return qr_svg(verification_url)


def linkedin_credential_url(document_id: str, verification_url: str, document_name: str = "LYTIX Verified Credential") -> str:
    issue_year = date.today().year
    issue_month = date.today().month
    return (
        "https://www.linkedin.com/profile/add?"
        f"startTask=CERTIFICATION_NAME&name={quote_plus(document_name)}"
        f"&organizationName={quote_plus('LYTIX TECHNOLOGIES')}"
        f"&issueYear={issue_year}&issueMonth={issue_month}"
        f"&certUrl={quote_plus(verification_url)}&certId={quote_plus(document_id)}"
    )


def _build_letter_document(
    application: dict,
    document_id: str,
    verification_url: str,
    title: str,
    body: list[str],
) -> bytes:
    try:
        return _reportlab_letter(application, document_id, verification_url, title, body)
    except Exception:
        return _fallback_letter(application, document_id, verification_url, title, body)


def _reportlab_offer(
    application: dict, offer_letter_id: str, certificate_id: str | None, verification_url: str
) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    pdf.setFillColor(colors.HexColor("#05070A"))
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setFillColor(colors.HexColor("#12D6C5"))
    pdf.rect(0, height - 34 * mm, width, 4 * mm, fill=1, stroke=0)
    _draw_reportlab_logo(pdf, 20 * mm, height - 29 * mm, 72 * mm, 22 * mm)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(112 * mm, height - 20 * mm, "Internship Offer Letter")
    pdf.setFont("Helvetica", 9)
    pdf.drawString(112 * mm, height - 28 * mm, TAGLINE)

    y = height - 52 * mm
    pdf.setFillColor(colors.HexColor("#DCEBFF"))
    rows = [
        ("Offer Letter ID", offer_letter_id),
        ("Student Name", application["student"]["name"]),
        ("Internship Domain", application["domain"]["name"]),
        ("Internship ID", application["internship_id"]),
        ("Start Date", _safe(application.get("start_date"))),
        ("End Date", _safe(application.get("end_date"))),
        ("Certificate ID", _safe(certificate_id)),
        ("Credential ID", offer_letter_id),
        ("QR Verification Link", verification_url),
        ("Verification Portal", VERIFICATION_PORTAL),
        ("Authorized Signatory", f"{FOUNDER_NAME}, {FOUNDER_TITLE}"),
    ]
    for label, value in rows:
        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(22 * mm, y, f"{label}:")
        pdf.setFont("Helvetica", 10)
        pdf.drawString(62 * mm, y, str(value)[:86])
        y -= 9 * mm

    y -= 6 * mm
    pdf.setFont("Helvetica", 11)
    text = pdf.beginText(22 * mm, y)
    text.setLeading(15)
    for line in [
        f"Dear {application['student']['name']},",
        f"You have been selected for the {application['domain']['name']} internship at LYTIX TECHNOLOGIES.",
        "This offer confirms your enrollment in the MVP internship management platform.",
        "Complete payment, assigned tasks, final project submission, LinkedIn update, and verification steps.",
    ]:
        text.textLine(line)
    pdf.drawText(text)

    pdf.setFillColor(colors.HexColor("#12D6C5"))
    pdf.rect(22 * mm, 44 * mm, 62 * mm, 12 * mm, fill=1, stroke=0)
    pdf.setFillColor(colors.HexColor("#05070A"))
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(27 * mm, 49 * mm, FOUNDER_NAME)
    pdf.setFont("Helvetica", 7)
    pdf.drawString(27 * mm, 46 * mm, FOUNDER_TITLE)
    pdf.save()
    return buffer.getvalue()


def _reportlab_certificate(application: dict, certificate_id: str, verification_url: str) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)
    pdf.setFillColor(colors.HexColor("#05070A"))
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setFillColor(colors.HexColor("#F3F8FF"))
    pdf.rect(14 * mm, 14 * mm, width - 28 * mm, height - 28 * mm, fill=1, stroke=0)
    pdf.setFillColor(colors.HexColor("#12D6C5"))
    pdf.rect(14 * mm, height - 24 * mm, width - 28 * mm, 4 * mm, fill=1, stroke=0)

    pdf.setFillColor(colors.HexColor("#05070A"))
    pdf.rect(24 * mm, height - 45 * mm, 78 * mm, 28 * mm, fill=1, stroke=0)
    _draw_reportlab_logo(pdf, 28 * mm, height - 40 * mm, 68 * mm, 20 * mm)
    pdf.setFillColor(colors.HexColor("#05070A"))
    pdf.setFont("Helvetica", 9)
    pdf.drawString(112 * mm, height - 30 * mm, TAGLINE)
    pdf.setFont("Helvetica-Bold", 28)
    pdf.drawString(28 * mm, height - 62 * mm, "Certificate of Internship Completion")
    pdf.setFont("Helvetica", 12)
    pdf.drawString(28 * mm, height - 80 * mm, "This certifies that")
    pdf.setFont("Helvetica-Bold", 26)
    pdf.drawString(28 * mm, height - 96 * mm, application["student"]["name"])
    pdf.setFont("Helvetica", 13)
    pdf.drawString(
        28 * mm,
        height - 112 * mm,
        f"completed the {application['domain']['name']} internship program.",
    )

    rows = [
        ("Internship ID", application["internship_id"]),
        ("Start Date", _safe(application.get("start_date"))),
        ("End Date", _safe(application.get("end_date"))),
        ("Certificate Number", certificate_id),
        ("Certificate ID", certificate_id),
        ("Unique Credential ID", certificate_id),
        ("Issue Date", date.today().isoformat()),
        ("Verification URL", verification_url),
        ("Verification Portal", VERIFICATION_PORTAL),
        ("Digital Signature", f"{FOUNDER_NAME}, {FOUNDER_TITLE}"),
        ("LinkedIn Credential URL", linkedin_credential_url(certificate_id, verification_url, "LYTIX Internship Certificate")),
    ]
    y = height - 134 * mm
    for label, value in rows:
        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(28 * mm, y, f"{label}:")
        pdf.setFont("Helvetica", 9)
        pdf.drawString(68 * mm, y, str(value)[:90])
        y -= 7 * mm

    _draw_reportlab_qr(pdf, verification_url, width - 58 * mm, 48 * mm, 34 * mm)
    pdf.setFillColor(colors.HexColor("#05070A"))
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(width - 60 * mm, 39 * mm, "Scan to verify")
    pdf.rect(28 * mm, 34 * mm, 70 * mm, 12 * mm, stroke=0, fill=1)
    pdf.setFillColor(colors.white)
    pdf.drawString(34 * mm, 39 * mm, FOUNDER_NAME)
    pdf.setFont("Helvetica", 7)
    pdf.drawString(34 * mm, 36 * mm, FOUNDER_TITLE)
    pdf.save()
    return buffer.getvalue()


def _reportlab_letter(
    application: dict,
    document_id: str,
    verification_url: str,
    title: str,
    body: list[str],
) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    pdf.setFillColor(colors.HexColor("#05070A"))
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setFillColor(colors.HexColor("#F3F8FF"))
    pdf.rect(14 * mm, 14 * mm, width - 28 * mm, height - 28 * mm, fill=1, stroke=0)
    pdf.setFillColor(colors.HexColor("#12D6C5"))
    pdf.rect(14 * mm, height - 28 * mm, width - 28 * mm, 4 * mm, fill=1, stroke=0)

    pdf.setFillColor(colors.HexColor("#05070A"))
    pdf.rect(22 * mm, height - 48 * mm, 76 * mm, 28 * mm, fill=1, stroke=0)
    _draw_reportlab_logo(pdf, 26 * mm, height - 43 * mm, 66 * mm, 20 * mm)
    pdf.setFillColor(colors.HexColor("#05070A"))
    pdf.setFont("Helvetica", 9)
    pdf.drawString(108 * mm, height - 34 * mm, TAGLINE)
    pdf.setFont("Helvetica-Bold", 24)
    pdf.drawString(24 * mm, height - 60 * mm, title)

    rows = [
        ("Student Name", application["student"]["name"]),
        ("Domain", application["domain"]["name"]),
        ("Internship ID", application["internship_id"]),
        ("Start Date", _safe(application.get("start_date"))),
        ("End Date", _safe(application.get("end_date"))),
        ("Document ID", document_id),
        ("Unique Credential ID", document_id),
        ("Issue Date", date.today().isoformat()),
        ("Verification URL", verification_url),
        ("Verification Portal", VERIFICATION_PORTAL),
        ("Digital Signature", f"{FOUNDER_NAME}, {FOUNDER_TITLE}"),
        ("LinkedIn Credential URL", linkedin_credential_url(document_id, verification_url, title)),
    ]
    y = height - 82 * mm
    for label, value in rows:
        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(24 * mm, y, f"{label}:")
        pdf.setFont("Helvetica", 9)
        pdf.drawString(58 * mm, y, str(value)[:88])
        y -= 7 * mm

    y -= 8 * mm
    text = pdf.beginText(24 * mm, y)
    text.setLeading(16)
    text.setFont("Helvetica", 11)
    for paragraph in body:
        for chunk in _wrap_pdf_text(paragraph, 92):
            text.textLine(chunk)
        text.textLine("")
    pdf.drawText(text)

    _draw_reportlab_qr(pdf, verification_url, width - 52 * mm, 38 * mm, 30 * mm)
    pdf.setFillColor(colors.HexColor("#05070A"))
    pdf.rect(24 * mm, 38 * mm, 66 * mm, 12 * mm, stroke=0, fill=1)
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 9)
    pdf.drawString(30 * mm, 43 * mm, FOUNDER_NAME)
    pdf.setFont("Helvetica", 7)
    pdf.drawString(30 * mm, 40 * mm, FOUNDER_TITLE)
    pdf.save()
    return buffer.getvalue()


def _draw_reportlab_logo(pdf, x: float, y: float, width: float, height: float) -> None:
    from reportlab.lib import colors

    if LOGO_PATH.exists():
        pdf.drawImage(
            str(LOGO_PATH),
            x,
            y,
            width=width,
            height=height,
            preserveAspectRatio=True,
            mask="auto",
        )
        return
    pdf.setFillColor(colors.white)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(x, y + height / 2, "LYTIX TECHNOLOGIES")


def _wrap_pdf_text(value: str, width: int) -> list[str]:
    words = value.split()
    lines: list[str] = []
    current: list[str] = []
    for word in words:
        candidate = " ".join([*current, word])
        if len(candidate) > width and current:
            lines.append(" ".join(current))
            current = [word]
        else:
            current.append(word)
    if current:
        lines.append(" ".join(current))
    return lines or [""]


def _draw_reportlab_qr(pdf, data: str, x: float, y: float, size: float) -> None:
    from reportlab.lib import colors

    try:
        import qrcode

        matrix = qrcode.QRCode(border=0)
        matrix.add_data(data)
        matrix.make(fit=True)
        rows = matrix.get_matrix()
    except Exception:
        from app.pdf import qr_matrix

        rows = qr_matrix(data)
    module = size / len(rows)
    pdf.setFillColor(colors.white)
    pdf.rect(x - 4, y - 4, size + 8, size + 8, stroke=0, fill=1)
    pdf.setFillColor(colors.HexColor("#05070A"))
    for row_index, row in enumerate(rows):
        for col_index, active in enumerate(row):
            if active:
                pdf.rect(
                    x + col_index * module,
                    y + size - (row_index + 1) * module,
                    module + 0.1,
                    module + 0.1,
                    stroke=0,
                    fill=1,
                )


def _fallback_offer(
    application: dict, offer_letter_id: str, certificate_id: str | None, verification_url: str
) -> bytes:
    content = PdfContent()
    content.fill(0.965, 0.976, 0.988)
    content.rect(0, 0, 612, 792)
    content.fill(0.02, 0.05, 0.08)
    content.rect(0, 700, 612, 92)
    content.fill(0.0, 0.75, 0.7)
    content.rect(0, 696, 612, 5)
    content.fill(1, 1, 1)
    content.text(56, 744, "LYTIX TECHNOLOGIES", 20, bold=True)
    content.text(56, 724, TAGLINE, 9)
    content.text(56, 706, "Internship Offer Letter", 14)
    content.fill(0.08, 0.1, 0.13)
    rows = [
        f"Offer Letter ID: {offer_letter_id}",
        f"Student Name: {application['student']['name']}",
        f"Internship Domain: {application['domain']['name']}",
        f"Internship ID: {application['internship_id']}",
        f"Start Date: {_safe(application.get('start_date'))}",
        f"End Date: {_safe(application.get('end_date'))}",
        f"Certificate ID: {_safe(certificate_id)}",
        f"Unique Credential ID: {offer_letter_id}",
        f"QR Verification Link: {verification_url}",
        f"Verification Portal: {VERIFICATION_PORTAL}",
        f"Authorized Signature: {FOUNDER_NAME}, {FOUNDER_TITLE}",
    ]
    content.body_lines(56, 650, rows, size=11, leading=20)
    return build_pdf(content)


def _fallback_certificate(application: dict, certificate_id: str, verification_url: str) -> bytes:
    content = PdfContent()
    content.fill(0.98, 0.985, 0.99)
    content.rect(0, 0, 612, 792)
    content.fill(0.015, 0.025, 0.035)
    content.rect(34, 34, 544, 724)
    content.fill(0.94, 0.965, 0.98)
    content.rect(44, 44, 524, 704)
    content.fill(0.04, 0.06, 0.08)
    content.text(76, 620, "LYTIX TECHNOLOGIES", 18, bold=True)
    content.text(76, 604, TAGLINE, 9)
    content.text(76, 590, "Certificate of Internship Completion", 24, bold=True)
    rows = [
        f"Student Name: {application['student']['name']}",
        f"Internship Domain: {application['domain']['name']}",
        f"Internship ID: {application['internship_id']}",
        f"Start Date: {_safe(application.get('start_date'))}",
        f"End Date: {_safe(application.get('end_date'))}",
        f"Certificate ID: {certificate_id}",
        f"Unique Credential ID: {certificate_id}",
        f"Issue Date: {date.today().isoformat()}",
        f"QR Verification Link: {verification_url}",
        f"Verification Portal: {VERIFICATION_PORTAL}",
        f"LinkedIn Credential URL: {linkedin_credential_url(certificate_id, verification_url, 'LYTIX Internship Certificate')}",
        f"Authorized Signature: {FOUNDER_NAME}, {FOUNDER_TITLE}",
    ]
    content.body_lines(76, 536, rows, size=11, leading=20)
    draw_qr(content, verification_url, 420, 360, 102)
    return build_pdf(content)


def _fallback_letter(
    application: dict,
    document_id: str,
    verification_url: str,
    title: str,
    body: list[str],
) -> bytes:
    content = PdfContent()
    content.fill(0.98, 0.985, 0.99)
    content.rect(0, 0, 612, 792)
    content.fill(0.04, 0.06, 0.08)
    content.text(56, 736, "LYTIX TECHNOLOGIES", 18, bold=True)
    content.text(56, 720, TAGLINE, 9)
    content.text(56, 698, title, 22, bold=True)
    rows = [
        f"Student Name: {application['student']['name']}",
        f"Domain: {application['domain']['name']}",
        f"Internship ID: {application['internship_id']}",
        f"Start Date: {_safe(application.get('start_date'))}",
        f"End Date: {_safe(application.get('end_date'))}",
        f"Document ID: {document_id}",
        f"Unique Credential ID: {document_id}",
        f"Issue Date: {date.today().isoformat()}",
        f"Verification URL: {verification_url}",
        f"Verification Portal: {VERIFICATION_PORTAL}",
        f"LinkedIn Credential URL: {linkedin_credential_url(document_id, verification_url, title)}",
        "",
        *body,
        "",
        f"Authorized Signature: {FOUNDER_NAME}, {FOUNDER_TITLE}",
    ]
    content.body_lines(56, 668, rows, size=11, leading=18)
    draw_qr(content, verification_url, 420, 100, 102)
    return build_pdf(content)

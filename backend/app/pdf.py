import hashlib
import textwrap
from datetime import datetime
from typing import Iterable


PAGE_WIDTH = 612
PAGE_HEIGHT = 792
TAGLINE = "Learn. Build. Innovate."
FOUNDER_SIGNATURE = "Sunil Kumar, Founder & CEO"


def _escape_pdf(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _wrap(value: str, width: int = 82) -> list[str]:
    return textwrap.wrap(value, width=width) or [""]


class PdfContent:
    def __init__(self) -> None:
        self.commands: list[str] = []

    def fill(self, r: float, g: float, b: float) -> None:
        self.commands.append(f"{r:.3f} {g:.3f} {b:.3f} rg")

    def rect(self, x: float, y: float, width: float, height: float) -> None:
        self.commands.append(f"{x:.2f} {y:.2f} {width:.2f} {height:.2f} re f")

    def line(self, x1: float, y1: float, x2: float, y2: float) -> None:
        self.commands.append(
            f"0.8 0.8 0.8 RG 1.2 w {x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S"
        )

    def text(self, x: float, y: float, text: str, size: int = 11, bold: bool = False) -> None:
        font = "F2" if bold else "F1"
        safe = _escape_pdf(text)
        self.commands.append(f"BT /{font} {size} Tf {x:.2f} {y:.2f} Td ({safe}) Tj ET")

    def body_lines(
        self, x: float, y: float, lines: Iterable[str], size: int = 11, leading: int = 18
    ) -> float:
        cursor_y = y
        for line in lines:
            for wrapped in _wrap(line):
                self.text(x, cursor_y, wrapped, size=size)
                cursor_y -= leading
        return cursor_y

    def output(self) -> str:
        return "\n".join(self.commands)


def _fallback_matrix(data: str) -> list[list[bool]]:
    digest = hashlib.sha256(data.encode("utf-8")).digest()
    size = 29
    matrix = [[False for _ in range(size)] for _ in range(size)]

    def add_finder(offset_x: int, offset_y: int) -> None:
        for y in range(7):
            for x in range(7):
                edge = x in (0, 6) or y in (0, 6)
                center = 2 <= x <= 4 and 2 <= y <= 4
                matrix[offset_y + y][offset_x + x] = edge or center

    add_finder(0, 0)
    add_finder(size - 7, 0)
    add_finder(0, size - 7)
    for y in range(size):
        for x in range(size):
            if matrix[y][x]:
                continue
            byte = digest[(x * 11 + y * 7) % len(digest)]
            matrix[y][x] = ((byte >> ((x + y) % 8)) & 1) == 1
    return matrix


def qr_matrix(data: str) -> list[list[bool]]:
    try:
        import qrcode

        qr = qrcode.QRCode(border=0, error_correction=qrcode.constants.ERROR_CORRECT_M)
        qr.add_data(data)
        qr.make(fit=True)
        return qr.get_matrix()
    except Exception:
        return _fallback_matrix(data)


def draw_qr(content: PdfContent, data: str, x: float, y: float, size: float) -> None:
    matrix = qr_matrix(data)
    module = size / len(matrix)
    content.fill(1, 1, 1)
    content.rect(x - 6, y - 6, size + 12, size + 12)
    content.fill(0.02, 0.03, 0.04)
    for row_index, row in enumerate(matrix):
        for col_index, active in enumerate(row):
            if active:
                content.rect(
                    x + col_index * module,
                    y + size - (row_index + 1) * module,
                    module + 0.05,
                    module + 0.05,
                )


def build_pdf(content: PdfContent) -> bytes:
    stream = content.output().encode("latin-1", errors="replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        (
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>"
        ),
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream",
    ]

    output = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode("ascii"))
        output.extend(obj)
        output.extend(b"\nendobj\n")

    xref_offset = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    output.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_offset}\n%%EOF"
        ).encode("ascii")
    )
    return bytes(output)


def create_offer_letter(student: dict, domain: dict, application: dict, document: dict) -> bytes:
    content = PdfContent()
    content.fill(0.965, 0.976, 0.988)
    content.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    content.fill(0.02, 0.05, 0.08)
    content.rect(0, 700, PAGE_WIDTH, 92)
    content.fill(0.0, 0.75, 0.7)
    content.rect(0, 696, PAGE_WIDTH, 5)
    content.fill(1, 1, 1)
    content.text(56, 744, "LYTIX TECHNOLOGIES", 20, bold=True)
    content.text(56, 724, TAGLINE, 9)
    content.text(56, 706, "Internship Offer Letter", 14)

    content.fill(0.08, 0.1, 0.13)
    content.text(56, 650, f"Document No: {document['document_number']}", 10)
    content.text(56, 632, f"Issued At: {document['issued_at']}", 10)
    content.line(56, 612, 556, 612)

    lines = [
        f"Dear {student['name']},",
        (
            "We are pleased to offer you an internship with LYTIX TECHNOLOGIES in "
            f"the {domain['name']} domain. This MVP offer records your selection and "
            "internship onboarding status in the LYTIX platform."
        ),
        f"Internship Duration: {domain['duration_weeks']} weeks",
        f"Program Fee: INR {domain['fee']}",
        f"Current Workflow Stage: {application['status']}",
        "Next Steps: Complete onboarding, payment confirmation, assigned tasks, final project, LinkedIn update, and certificate verification.",
        "This letter is system generated and valid for internal MVP operations.",
    ]
    cursor_y = content.body_lines(56, 574, lines, size=11, leading=18)

    content.fill(0.0, 0.55, 0.5)
    content.rect(56, cursor_y - 28, 170, 28)
    content.fill(1, 1, 1)
    content.text(68, cursor_y - 18, FOUNDER_SIGNATURE, 10, bold=True)
    return build_pdf(content)


def create_certificate(
    student: dict,
    domain: dict,
    application: dict,
    document: dict,
    verification_url: str,
) -> bytes:
    content = PdfContent()
    content.fill(0.98, 0.985, 0.99)
    content.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    content.fill(0.015, 0.025, 0.035)
    content.rect(34, 34, PAGE_WIDTH - 68, PAGE_HEIGHT - 68)
    content.fill(0.94, 0.965, 0.98)
    content.rect(44, 44, PAGE_WIDTH - 88, PAGE_HEIGHT - 88)
    content.fill(0.0, 0.62, 0.56)
    content.rect(44, 676, PAGE_WIDTH - 88, 8)
    content.fill(0.86, 0.52, 0.12)
    content.rect(44, 666, PAGE_WIDTH - 88, 4)

    content.fill(0.04, 0.06, 0.08)
    content.text(76, 620, "LYTIX TECHNOLOGIES", 18, bold=True)
    content.text(76, 604, TAGLINE, 9)
    content.text(76, 590, "Certificate of Internship Completion", 24, bold=True)
    content.text(76, 548, "This certifies that", 12)
    content.text(76, 512, student["name"], 26, bold=True)
    content.text(76, 476, f"has completed the {domain['name']} internship program.", 13)
    content.text(76, 448, f"Final Project: {application.get('final_project_url') or 'Submitted in platform'}", 10)
    content.text(76, 426, f"Certificate No: {document['document_number']}", 10)
    content.text(76, 408, f"Verification Code: {document['verification_code']}", 10, bold=True)
    content.text(76, 390, f"Issued At: {document['issued_at']}", 10)
    content.text(76, 348, "Scan or visit the verification URL below:", 10, bold=True)
    content.text(76, 330, verification_url, 9)

    draw_qr(content, verification_url, 420, 360, 102)
    content.fill(0.04, 0.06, 0.08)
    content.text(410, 336, "QR Verification", 10, bold=True)

    content.fill(0.0, 0.48, 0.43)
    content.rect(76, 232, 184, 32)
    content.fill(1, 1, 1)
    content.text(90, 243, FOUNDER_SIGNATURE, 10, bold=True)
    return build_pdf(content)


def issue_timestamp() -> str:
    return datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")


def qr_svg(data: str, box_size: int = 8) -> str:
    matrix = qr_matrix(data)
    modules = len(matrix)
    size = modules * box_size
    rects = []
    for y, row in enumerate(matrix):
        for x, active in enumerate(row):
            if active:
                rects.append(
                    f'<rect x="{x * box_size}" y="{y * box_size}" width="{box_size}" height="{box_size}"/>'
                )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" '
        f'width="{size}" height="{size}" role="img" aria-label="Certificate QR code">'
        '<rect width="100%" height="100%" fill="#ffffff"/>'
        f'<g fill="#05070a">{"".join(rects)}</g></svg>'
    )

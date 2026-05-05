from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


OUT_DIR = Path("deliverables")
PPTX_OUT = OUT_DIR / "CAREVO_VC_McKinsey_Style_Template.pptx"
POTX_OUT = OUT_DIR / "CAREVO_VC_McKinsey_Style_Template.potx"
NOTES_OUT = OUT_DIR / "CAREVO_VC_McKinsey_Style_Template_source_notes.md"

EMU_PER_INCH = 914400
LINE_WIDTH_PER_PT = 12700
SLIDE_W = 13.333333
SLIDE_H = 7.5

FONT = "Helvetica"
MONO = "Courier"

BLACK = "0A0A0F"
WHITE = "FFFFFF"
TEAL = "1E6B72"
SURFACE = "F4F4F6"
BORDER = "E8E8EC"
MUTED = "9B9BA8"
SECONDARY = "4A4A4F"
ERROR = "CC2929"


NS = {
    "a": "http://schemas.openxmlformats.org/drawingml/2006/main",
    "p": "http://schemas.openxmlformats.org/presentationml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


LAYOUTS = [
    "CAREVO 01 Cover",
    "CAREVO 02 Section Divider",
    "CAREVO 03 Executive Summary",
    "CAREVO 04 Statement / Big Number",
    "CAREVO 05 Two-Column Analysis",
    "CAREVO 06 Three-Column Cards",
    "CAREVO 07 Data Chart",
    "CAREVO 08 KPI Dashboard",
    "CAREVO 09 Table / Tracker",
    "CAREVO 10 Matrix 2x2",
    "CAREVO 11 Timeline / Roadmap",
    "CAREVO 12 Process Flow",
    "CAREVO 13 Product Workflow",
    "CAREVO 14 Quote / Principle",
    "CAREVO 15 Team / Org",
    "CAREVO 16 Appendix",
    "CAREVO 17 Closing",
]


def emu(value: float) -> int:
    return round(value * EMU_PER_INCH)


def pt(value: float) -> int:
    return round(value * LINE_WIDTH_PER_PT)


def sz(value: float) -> int:
    return round(value * 100)


def xml(text: str) -> str:
    return escape(str(text), {'"': "&quot;"})


def color_fill(color: str, alpha: int | None = None) -> str:
    if alpha is None:
        return f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
    return f'<a:solidFill><a:srgbClr val="{color}"><a:alpha val="{alpha}"/></a:srgbClr></a:solidFill>'


def line_xml(color: str | None = None, width_pt: float = 0.5) -> str:
    if not color:
        return '<a:ln><a:noFill/></a:ln>'
    return (
        f'<a:ln w="{pt(width_pt)}">'
        f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        "</a:ln>"
    )


def paragraph_xml(
    text: str,
    *,
    size: float,
    color: str,
    bold: bool = False,
    italic: bool = False,
    font: str = FONT,
    align: str = "l",
    bullet: bool = False,
) -> str:
    ppr = f'<a:pPr algn="{align}"/>'
    if bullet:
        ppr = (
            f'<a:pPr algn="{align}" marL="171450" indent="-114300">'
            '<a:buChar char="•"/>'
            "</a:pPr>"
        )
    style = []
    if bold:
        style.append('b="1"')
    if italic:
        style.append('i="1"')
    attrs = " ".join(style)
    if attrs:
        attrs = " " + attrs
    return (
        "<a:p>"
        f"{ppr}"
        "<a:r>"
        f'<a:rPr lang="de-DE" sz="{sz(size)}"{attrs} dirty="0">'
        f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        f'<a:latin typeface="{xml(font)}"/>'
        "</a:rPr>"
        f"<a:t>{xml(text)}</a:t>"
        "</a:r>"
        f'<a:endParaRPr lang="de-DE" sz="{sz(size)}" dirty="0">'
        f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
        f'<a:latin typeface="{xml(font)}"/>'
        "</a:endParaRPr>"
        "</a:p>"
    )


@dataclass
class Slide:
    name: str
    layout: int
    bg: str = WHITE

    def __post_init__(self) -> None:
        self._id = 2
        self.shapes: list[str] = []

    def next_id(self, prefix: str) -> tuple[int, str]:
        shape_id = self._id
        self._id += 1
        return shape_id, f"{prefix} {shape_id}"

    def add(self, shape: str) -> None:
        self.shapes.append(shape)

    def rect(
        self,
        x: float,
        y: float,
        w: float,
        h: float,
        *,
        fill: str | None = None,
        line: str | None = None,
        line_width: float = 0.5,
        radius: bool = False,
        alpha: int | None = None,
        name: str = "Shape",
    ) -> None:
        shape_id, shape_name = self.next_id(name)
        fill_xml = color_fill(fill, alpha) if fill else "<a:noFill/>"
        geom = "roundRect" if radius else "rect"
        self.add(
            "<p:sp>"
            "<p:nvSpPr>"
            f'<p:cNvPr id="{shape_id}" name="{xml(shape_name)}"/>'
            "<p:cNvSpPr/>"
            "<p:nvPr/>"
            "</p:nvSpPr>"
            "<p:spPr>"
            f'<a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
            f'<a:prstGeom prst="{geom}"><a:avLst/></a:prstGeom>'
            f"{fill_xml}"
            f"{line_xml(line, line_width)}"
            "</p:spPr>"
            "<p:style/>"
            "</p:sp>"
        )

    def text(
        self,
        x: float,
        y: float,
        w: float,
        h: float,
        text: str,
        *,
        size: float = 12,
        color: str = BLACK,
        bold: bool = False,
        italic: bool = False,
        font: str = FONT,
        align: str = "l",
        valign: str = "t",
        margin: float = 0.02,
        name: str = "Text",
    ) -> None:
        shape_id, shape_name = self.next_id(name)
        paragraphs = [
            paragraph_xml(
                p,
                size=size,
                color=color,
                bold=bold,
                italic=italic,
                font=font,
                align=align,
            )
            for p in text.split("\n")
        ]
        self.add(
            "<p:sp>"
            "<p:nvSpPr>"
            f'<p:cNvPr id="{shape_id}" name="{xml(shape_name)}"/>'
            "<p:cNvSpPr txBox=\"1\"/>"
            "<p:nvPr/>"
            "</p:nvSpPr>"
            "<p:spPr>"
            f'<a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
            "<a:noFill/>"
            f"{line_xml(None)}"
            "</p:spPr>"
            "<p:txBody>"
            f'<a:bodyPr wrap="square" rtlCol="0" anchor="{valign}" '
            f'lIns="{emu(margin)}" rIns="{emu(margin)}" tIns="{emu(margin)}" bIns="{emu(margin)}"/>'
            "<a:lstStyle/>"
            f"{''.join(paragraphs)}"
            "</p:txBody>"
            "</p:sp>"
        )

    def bullets(
        self,
        x: float,
        y: float,
        w: float,
        h: float,
        items: Iterable[str],
        *,
        size: float = 11,
        color: str = SECONDARY,
        font: str = FONT,
        name: str = "Bullets",
    ) -> None:
        shape_id, shape_name = self.next_id(name)
        paragraphs = [
            paragraph_xml(item, size=size, color=color, font=font, bullet=True)
            for item in items
        ]
        self.add(
            "<p:sp>"
            "<p:nvSpPr>"
            f'<p:cNvPr id="{shape_id}" name="{xml(shape_name)}"/>'
            "<p:cNvSpPr txBox=\"1\"/>"
            "<p:nvPr/>"
            "</p:nvSpPr>"
            "<p:spPr>"
            f'<a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
            "<a:noFill/>"
            f"{line_xml(None)}"
            "</p:spPr>"
            "<p:txBody>"
            f'<a:bodyPr wrap="square" rtlCol="0" anchor="t" lIns="{emu(0.01)}" rIns="{emu(0.01)}" tIns="{emu(0.01)}" bIns="{emu(0.01)}"/>'
            "<a:lstStyle/>"
            f"{''.join(paragraphs)}"
            "</p:txBody>"
            "</p:sp>"
        )


def slide_xml(slide: Slide) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<p:sld xmlns:a="{NS["a"]}" xmlns:r="{NS["r"]}" xmlns:p="{NS["p"]}">'
        f'<p:cSld name="{xml(slide.name)}">'
        "<p:bg><p:bgPr>"
        f'<a:solidFill><a:srgbClr val="{slide.bg}"/></a:solidFill>'
        "<a:effectLst/>"
        "</p:bgPr></p:bg>"
        "<p:spTree>"
        "<p:nvGrpSpPr>"
        '<p:cNvPr id="1" name=""/>'
        "<p:cNvGrpSpPr/>"
        "<p:nvPr/>"
        "</p:nvGrpSpPr>"
        "<p:grpSpPr>"
        '<a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm>'
        "</p:grpSpPr>"
        f"{''.join(slide.shapes)}"
        "</p:spTree>"
        "</p:cSld>"
        "<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>"
        "</p:sld>"
    )


def rels_xml(relationships: list[tuple[str, str, str]]) -> str:
    rows = [
        f'<Relationship Id="{rid}" Type="{typ}" Target="{xml(target)}"/>'
        for rid, typ, target in relationships
    ]
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        f"{''.join(rows)}"
        "</Relationships>"
    )


def common_header(slide: Slide, section: str, title: str, page: int) -> None:
    slide.rect(0, 0, 0.045, SLIDE_H, fill=TEAL, name="CAREVO accent bar")
    slide.text(0.62, 0.32, 4.7, 0.22, section.upper(), size=7.5, color=MUTED, bold=True, font=MONO)
    slide.rect(0.62, 0.72, 12.08, 0.006, fill=BORDER, name="Header rule")
    slide.text(0.62, 0.88, 11.0, 0.58, title, size=24, color=BLACK, bold=True)
    footer(slide, page)


def footer(slide: Slide, page: int, dark: bool = False) -> None:
    rule = SECONDARY if dark else BORDER
    color = MUTED
    slide.rect(0.62, 7.02, 12.08, 0.006, fill=rule, name="Footer rule")
    slide.text(0.62, 7.12, 4.2, 0.18, "CAREVO VC / CONSULTING TEMPLATE", size=6.8, color=color, font=MONO)
    slide.text(5.0, 7.12, 4.2, 0.18, "CONFIDENTIAL - TEMPLATE", size=6.8, color=color, font=MONO, align="ctr")
    slide.text(12.05, 7.12, 0.65, 0.18, f"{page:02}", size=6.8, color=color, font=MONO, align="r")


def logo(slide: Slide, x: float, y: float, dark: bool = False) -> None:
    text_color = WHITE if dark else BLACK
    sub_color = MUTED
    slide.text(x, y - 0.03, 0.24, 0.28, "C", size=20, color=TEAL, bold=True)
    slide.text(x + 0.34, y, 1.2, 0.22, "CAREVO", size=12, color=text_color, bold=True)
    slide.text(x + 0.34, y + 0.19, 2.2, 0.16, "Dokumentation fuer Pflege und Versorgung", size=5.8, color=sub_color)


def color_strip(slide: Slide, x: float, y: float, w: float, h: float) -> None:
    colors = [BLACK, WHITE, TEAL, SURFACE, BORDER, MUTED, SECONDARY, ERROR]
    labels = ["#0A0A0F", "#FFFFFF", "#1E6B72", "#F4F4F6", "#E8E8EC", "#9B9BA8", "#4A4A4F", "#CC2929"]
    gap = 0.04
    cell = (w - gap * (len(colors) - 1)) / len(colors)
    for i, (c, label) in enumerate(zip(colors, labels, strict=True)):
        sx = x + i * (cell + gap)
        slide.rect(sx, y, cell, h, fill=c, line=BORDER if c == WHITE else None, name="Color swatch")
        slide.text(sx, y + h + 0.06, cell, 0.13, label, size=5.8, color=MUTED, font=MONO, align="ctr")


def card(slide: Slide, x: float, y: float, w: float, h: float, eyebrow: str, title: str, body: str) -> None:
    slide.rect(x, y, w, h, fill=WHITE, line=BORDER, name="Card")
    slide.rect(x + 0.16, y + 0.18, 0.04, 0.04, fill=TEAL, name="Card marker")
    slide.text(x + 0.16, y + 0.31, w - 0.32, 0.16, eyebrow.upper(), size=6.8, color=MUTED, bold=True, font=MONO)
    slide.text(x + 0.16, y + 0.55, w - 0.32, 0.35, title, size=13, color=BLACK, bold=True)
    slide.text(x + 0.16, y + 0.98, w - 0.32, h - 1.05, body, size=9.2, color=SECONDARY)


def metric(slide: Slide, x: float, y: float, w: float, h: float, label: str, value: str, sub: str) -> None:
    slide.rect(x, y, w, h, fill=WHITE, line=BORDER, name="Metric")
    slide.text(x + 0.14, y + 0.13, w - 0.28, 0.16, label.upper(), size=6.5, color=MUTED, font=MONO, bold=True)
    slide.text(x + 0.14, y + 0.38, w - 0.28, 0.34, value, size=21, color=BLACK, bold=True)
    slide.text(x + 0.14, y + 0.82, w - 0.28, 0.22, sub, size=7.5, color=SECONDARY)


def table(
    slide: Slide,
    x: float,
    y: float,
    col_widths: list[float],
    row_h: float,
    headers: list[str],
    rows: list[list[str]],
) -> None:
    total_w = sum(col_widths)
    slide.rect(x, y, total_w, row_h, fill=BLACK, line=None, name="Table header")
    cx = x
    for w, header in zip(col_widths, headers, strict=True):
        slide.text(cx + 0.08, y + 0.1, w - 0.16, row_h - 0.14, header, size=7.4, color=WHITE, bold=True, font=MONO)
        cx += w
    for r, row in enumerate(rows):
        yy = y + row_h * (r + 1)
        fill = SURFACE if r % 2 == 0 else WHITE
        cx = x
        for w, val in zip(col_widths, row, strict=True):
            slide.rect(cx, yy, w, row_h, fill=fill, line=BORDER, line_width=0.35, name="Table cell")
            slide.text(cx + 0.08, yy + 0.11, w - 0.16, row_h - 0.14, val, size=7.6, color=BLACK if cx == x else SECONDARY)
            cx += w


def bar_chart(slide: Slide, x: float, y: float, w: float, h: float, labels: list[str], vals: list[float]) -> None:
    max_val = max(vals)
    gap = 0.16
    bar_w = (w - gap * (len(vals) - 1)) / len(vals)
    slide.rect(x, y + h, w, 0.008, fill=BORDER, name="Chart baseline")
    for i, (label, val) in enumerate(zip(labels, vals, strict=True)):
        bh = h * (val / max_val)
        bx = x + i * (bar_w + gap)
        color = TEAL if i == vals.index(max_val) else SECONDARY if i % 2 else MUTED
        slide.rect(bx, y + h - bh, bar_w, bh, fill=color, name="Chart bar")
        slide.text(bx, y + h + 0.08, bar_w, 0.16, label, size=6.4, color=MUTED, font=MONO, align="ctr")
        slide.text(bx, y + h - bh - 0.18, bar_w, 0.14, f"{val:g}", size=7, color=BLACK, font=MONO, align="ctr")


def process(slide: Slide, x: float, y: float, w: float, labels: list[str]) -> None:
    gap = 0.16
    step_w = (w - gap * (len(labels) - 1)) / len(labels)
    for i, label in enumerate(labels):
        sx = x + i * (step_w + gap)
        slide.rect(sx, y, step_w, 0.92, fill=WHITE, line=BORDER, name="Process step")
        slide.text(sx + 0.12, y + 0.13, 0.42, 0.2, f"{i+1:02}", size=8, color=TEAL, bold=True, font=MONO)
        slide.text(sx + 0.12, y + 0.42, step_w - 0.24, 0.28, label, size=10, color=BLACK, bold=True)
        if i < len(labels) - 1:
            slide.text(sx + step_w + 0.02, y + 0.31, gap - 0.04, 0.2, ">", size=12, color=MUTED, bold=True, align="ctr")


def make_slides() -> list[Slide]:
    slides: list[Slide] = []

    s = Slide("Cover", 1, bg=BLACK)
    s.rect(0, 0, 0.055, SLIDE_H, fill=TEAL)
    s.text(0.72, 0.64, 1.3, 1.0, "C", size=92, color=TEAL, bold=True)
    s.text(0.74, 2.1, 6.4, 0.62, "CAREVO", size=42, color=WHITE, bold=True)
    s.text(0.76, 2.85, 7.2, 0.65, "VC- und Consulting-nahes PowerPoint Template", size=20, color=WHITE, bold=True)
    s.text(0.76, 3.65, 5.7, 0.52, "Praezise, ruhig, verantwortlich - aufgebaut auf den lokalen CAREVO Design-Dateien.", size=12.5, color=MUTED)
    s.rect(8.25, 4.3, 3.9, 1.25, fill=None, line=SECONDARY)
    s.text(8.45, 4.52, 1.5, 0.16, "VERSION", size=6.8, color=MUTED, font=MONO, bold=True)
    s.text(9.85, 4.52, 1.8, 0.16, "1.0 / 2026", size=6.8, color=WHITE, font=MONO)
    s.text(8.45, 4.86, 1.5, 0.16, "SYSTEM", size=6.8, color=MUTED, font=MONO, bold=True)
    s.text(9.85, 4.86, 1.9, 0.16, "CAREVO", size=6.8, color=WHITE, font=MONO)
    s.text(8.45, 5.2, 1.5, 0.16, "STYLE", size=6.8, color=MUTED, font=MONO, bold=True)
    s.text(9.85, 5.2, 2.0, 0.16, "VC / Board", size=6.8, color=WHITE, font=MONO)
    color_strip(s, 0.76, 6.35, 5.3, 0.16)
    footer(s, 1, dark=True)
    slides.append(s)

    s = Slide("Design Logic", 3)
    common_header(s, "Design Grundlage", "Klinische Stille als Investment-Kommunikation", 2)
    s.text(0.74, 1.78, 5.8, 0.62, "Das Template uebersetzt das CAREVO Designsystem in eine Board- und VC-taugliche Folienlogik.", size=20, color=BLACK, bold=True)
    card(s, 0.76, 2.75, 3.55, 1.58, "Prinzip 01", "Ruhe statt Show", "Viel Weissraum, klare Linien, keine dekorativen Farbverlaeufe. Jede Flaeche dient der Lesbarkeit.")
    card(s, 4.55, 2.75, 3.55, 1.58, "Prinzip 02", "Farbe als System", "Teal markiert Orientierung und Aktion. Grau strukturiert. Schwarz traegt Verantwortung.")
    card(s, 8.34, 2.75, 3.55, 1.58, "Prinzip 03", "Beweisfuehrung", "Consulting-nahe Headlines, Tabellen, Bruecken, Matrizen und Fussnoten statt Marketing-Flaechen.")
    s.rect(0.76, 4.92, 11.1, 0.72, fill=SURFACE, line=BORDER)
    s.text(0.98, 5.1, 2.0, 0.16, "QUELLEN", size=6.8, color=MUTED, bold=True, font=MONO)
    s.text(2.2, 5.04, 9.4, 0.26, "CAREVO_Brand_Design_Guide.pdf | carevo-design-philosophy.md | 03_UI_UX_SPEC.md | src/app/globals.css | tailwind.config.ts | logo.tsx", size=8.4, color=SECONDARY, font=MONO)
    color_strip(s, 0.76, 6.1, 7.25, 0.26)
    slides.append(s)

    s = Slide("Master Layout Index", 16)
    common_header(s, "Master Folien", "Alle Layouts sind als PowerPoint Slide Layouts angelegt", 3)
    s.text(0.76, 1.62, 8.5, 0.3, "Layout-Bibliothek fuer Pitch, Board, Strategie, Produkt und Appendix.", size=13, color=SECONDARY)
    start_x, start_y = 0.76, 2.08
    tile_w, tile_h = 2.28, 0.62
    for i, layout in enumerate(LAYOUTS):
        col = i % 5
        row = i // 5
        x = start_x + col * (tile_w + 0.16)
        y = start_y + row * (tile_h + 0.18)
        s.rect(x, y, tile_w, tile_h, fill=WHITE, line=BORDER)
        s.text(x + 0.1, y + 0.09, 0.34, 0.14, f"{i+1:02}", size=7.3, color=TEAL, font=MONO, bold=True)
        s.text(x + 0.48, y + 0.08, tile_w - 0.58, 0.34, layout.replace("CAREVO ", ""), size=7.5, color=BLACK, bold=True)
    s.rect(0.76, 5.65, 11.8, 0.7, fill=SURFACE, line=BORDER)
    s.text(0.98, 5.86, 10.9, 0.18, "Hinweis: Die Beispielslides nutzen diese Layouts direkt; in PowerPoint sind sie ueber Ansicht > Folienmaster bzw. Neue Folie sichtbar.", size=8.7, color=SECONDARY)
    slides.append(s)

    s = Slide("Executive Summary", 3)
    common_header(s, "Investment Narrative", "CAREVO positioniert Dokumentation als workflow-first Infrastruktur", 4)
    s.text(0.76, 1.7, 4.4, 0.55, "Ein ruhiger, nachweisorientierter Pitch-Aufbau: Problem, Loesung, Traktion, Wirtschaftlichkeit und Vertrauen.", size=16, color=BLACK, bold=True)
    s.bullets(0.82, 2.5, 4.2, 1.1, ["Dokumentationslast ist ein struktureller Engpass.", "CAREVO adressiert den End-to-End Prozess.", "Human-in-the-loop reduziert Blackbox-Risiko."], size=10.2)
    metric(s, 5.55, 1.75, 1.95, 1.05, "Sample KPI", "60s", "Freigabe-Ziel")
    metric(s, 7.75, 1.75, 1.95, 1.05, "Sample KPI", "3x", "Workflow-Hebel")
    metric(s, 9.95, 1.75, 1.95, 1.05, "Sample KPI", "DACH", "Fokusmarkt")
    card(s, 5.55, 3.25, 2.85, 1.42, "These", "Zeit zurueckgeben", "Die Marke formuliert klar: weniger Formulare, mehr Zeit fuer Menschen.")
    card(s, 8.68, 3.25, 2.85, 1.42, "These", "Trust by Design", "Reviewability, klare Zustaende und auditierbare Entscheidungen.")
    s.rect(5.55, 5.15, 6.0, 0.82, fill=BLACK)
    s.text(5.82, 5.36, 5.45, 0.2, "Board-taugliche Storyline: klarer roter Faden, wenige Farben, harte Struktur.", size=10.8, color=WHITE, bold=True)
    slides.append(s)

    s = Slide("One Page Investment Case", 5)
    common_header(s, "Executive Summary", "Investment Case wird als wenige belastbare Entscheidungsfragen gefuehrt", 5)
    left_items = [
        ("Problem", "Dokumentation bindet knappe Fachzeit."),
        ("Loesung", "Audio -> Entwurf -> Pruefung -> Freigabe."),
        ("Moat", "Workflow-Tiefe plus klinische Reviewbarkeit."),
        ("Ask", "Kapital wird in Produkt, Compliance und GTM uebersetzt."),
    ]
    for i, (t, b) in enumerate(left_items):
        y = 1.75 + i * 0.82
        s.rect(0.76, y, 4.6, 0.62, fill=WHITE, line=BORDER)
        s.text(0.94, y + 0.14, 1.0, 0.16, t.upper(), size=7, color=TEAL, font=MONO, bold=True)
        s.text(2.0, y + 0.12, 3.1, 0.18, b, size=9.4, color=BLACK, bold=True)
    s.rect(6.0, 1.75, 5.8, 3.9, fill=SURFACE, line=BORDER)
    s.text(6.25, 1.98, 5.25, 0.26, "Illustrative Entscheidungslogik", size=13, color=BLACK, bold=True)
    bar_chart(s, 6.35, 2.75, 4.9, 1.8, ["Pain", "Workflow", "Trust", "GTM"], [85, 78, 92, 64])
    s.text(6.35, 5.05, 4.9, 0.18, "Beispielwerte, als Platzhalter fuer echte Due-Diligence-Kennzahlen.", size=7.2, color=MUTED, font=MONO)
    slides.append(s)

    s = Slide("Problem", 4)
    common_header(s, "Problem", "Dokumentation ist kein Nebenprozess, sondern der operative Flaschenhals", 6)
    s.text(0.82, 1.72, 6.5, 1.05, "Fachkraefte verlieren Zeit in Formularen, obwohl Wert am Menschen entsteht.", size=30, color=BLACK, bold=True)
    s.text(0.86, 3.0, 5.5, 0.42, "Aus dem Brand Guide: CAREVO reduziert die Dokumentationslast und gibt Fachkraeften Zeit zurueck.", size=13, color=SECONDARY)
    card(s, 0.82, 4.05, 3.2, 1.25, "Pain 01", "Fragmentierte Tools", "Inselloesungen erzeugen Medienbrueche.")
    card(s, 4.25, 4.05, 3.2, 1.25, "Pain 02", "Unklare Zustaende", "Teams muessen sehen, ob Entwurf oder Freigabe vorliegt.")
    card(s, 7.68, 4.05, 3.2, 1.25, "Pain 03", "Review-Risiko", "AI ohne klare Pruefung erzeugt Vertrauensthemen.")
    slides.append(s)

    s = Slide("Why Now", 11)
    common_header(s, "Why Now", "Der Markt bewegt sich in Richtung reviewbarer AI-Workflows", 7)
    process(s, 0.82, 2.05, 10.9, ["Fachkraefte-Mangel", "AI-Akzeptanz", "Compliance-Druck", "Interoperabilitaet", "Board-Fokus"])
    s.rect(0.82, 3.68, 10.9, 1.2, fill=SURFACE, line=BORDER)
    s.text(1.08, 3.94, 2.0, 0.18, "VC IMPLIKATION", size=7, color=TEAL, font=MONO, bold=True)
    s.text(2.75, 3.85, 8.2, 0.36, "Gewinner sind Produkte, die nicht nur AI demonstrieren, sondern klinische Verantwortung in den Workflow einbauen.", size=15, color=BLACK, bold=True)
    s.text(0.84, 5.32, 10.5, 0.24, "Template-Platzhalter: externe Markt- und Regulierungsdaten hier mit Quellen ersetzen.", size=8, color=MUTED, font=MONO)
    slides.append(s)

    s = Slide("Product Thesis", 14)
    common_header(s, "Produktthese", "Das Produkt muss wie ein gutes Formular wirken: klar, pruefbar, vollstaendig", 8)
    s.rect(0.82, 1.78, 0.07, 3.25, fill=TEAL)
    s.text(1.08, 1.85, 8.6, 1.05, "Workflow-first. Cross-sector. Trust by Design.", size=31, color=BLACK, bold=True)
    s.text(1.1, 3.25, 8.4, 0.64, "Diese drei Prinzipien aus dem Brand Guide werden zur Produkt- und Investitionslogik: CAREVO gewinnt nicht durch Dekoration, sondern durch operative Klarheit.", size=14.5, color=SECONDARY)
    s.rect(9.95, 1.92, 1.55, 1.55, fill=BLACK)
    s.text(10.28, 2.2, 0.9, 0.6, "C", size=42, color=TEAL, bold=True, align="ctr")
    slides.append(s)

    s = Slide("Solution Workflow", 12)
    common_header(s, "Loesung", "CAREVO fuehrt vom Audio zur freigegebenen Dokumentation", 9)
    process(s, 0.82, 1.95, 10.9, ["Audio erfassen", "Transkript strukturieren", "AI Draft erzeugen", "Warnungen pruefen", "Freigeben & exportieren"])
    s.rect(0.82, 3.55, 4.95, 1.64, fill=WHITE, line=BORDER)
    s.text(1.04, 3.78, 4.4, 0.24, "Warum VC-relevant?", size=13, color=BLACK, bold=True)
    s.bullets(1.07, 4.18, 4.2, 0.7, ["End-to-End Prozess statt einzelner Feature-Wette.", "Reviewbarkeit wird zum Vertrauens-Moat."], size=9.2)
    s.rect(6.15, 3.55, 5.58, 1.64, fill=BLACK)
    s.text(6.42, 3.8, 5.0, 0.26, "Operating Principle", size=7, color=MUTED, font=MONO, bold=True)
    s.text(6.42, 4.16, 4.95, 0.44, "Kein Dead End im Workflow. Der Nutzer versteht Zustand und naechste Aktion.", size=14, color=WHITE, bold=True)
    slides.append(s)

    s = Slide("Human in the Loop", 5)
    common_header(s, "Trust by Design", "AI beschleunigt, aber die Fachkraft bleibt entscheidungsfaehig", 10)
    s.rect(0.82, 1.82, 5.15, 3.25, fill=WHITE, line=BORDER)
    s.text(1.08, 2.05, 4.5, 0.24, "AI unterstuetzt", size=15, color=BLACK, bold=True)
    s.bullets(1.1, 2.6, 4.2, 1.4, ["Transkription und Strukturierung", "Entwurf in passenden Dokumentationsabschnitten", "Hinweise auf Luecken und Widersprueche"], size=10)
    s.rect(6.35, 1.82, 5.15, 3.25, fill=WHITE, line=BORDER)
    s.text(6.61, 2.05, 4.5, 0.24, "Fachkraft verantwortet", size=15, color=BLACK, bold=True)
    s.bullets(6.63, 2.6, 4.2, 1.4, ["Pruefung, Voice Edit und Freigabe", "Lokales Dismissal von Warnungen", "Export nur nach sichtbarer Freigabe"], size=10)
    s.rect(0.82, 5.55, 10.68, 0.45, fill=SURFACE, line=BORDER)
    s.text(1.02, 5.68, 10.2, 0.16, "Headline-Logik: Vertrauen entsteht nicht aus AI-Magie, sondern aus nachvollziehbaren Zustaenden.", size=8.4, color=SECONDARY, font=MONO)
    slides.append(s)

    s = Slide("Stakeholder Value", 9)
    common_header(s, "Value Proposition", "Jeder Stakeholder bekommt eine andere Form von Entlastung", 11)
    table(
        s,
        0.82,
        1.8,
        [2.1, 3.2, 3.0, 2.3],
        0.55,
        ["Stakeholder", "Pain", "CAREVO Hebel", "Proof Point"],
        [
            ["Pflege", "Zeit in Formularen", "Audio -> Entwurf", "Minuten je Fall"],
            ["Leitung", "Qualitaet schwankt", "Vorlagen & Status", "Freigabequote"],
            ["IT", "Tool-Wildwuchs", "Workflow-Schale", "Integrationen"],
            ["Compliance", "AI Blackbox", "Warnungen & Audit", "Review Trail"],
            ["Investor", "Category Risk", "Vertical Depth", "Retention"],
        ],
    )
    slides.append(s)

    s = Slide("Narrative Matrix", 10)
    common_header(s, "Positionierung", "CAREVO gehoert in das Feld hoher Prozesskritikalitaet", 12)
    s.rect(1.3, 1.85, 8.6, 3.9, fill=WHITE, line=BORDER)
    s.rect(5.6, 1.85, 0.01, 3.9, fill=BORDER)
    s.rect(1.3, 3.8, 8.6, 0.01, fill=BORDER)
    s.text(1.45, 2.0, 3.7, 0.22, "Niedrige Workflow-Tiefe", size=9, color=MUTED, font=MONO)
    s.text(5.9, 2.0, 3.7, 0.22, "Hohe Workflow-Tiefe", size=9, color=MUTED, font=MONO)
    s.text(1.45, 4.15, 3.7, 0.22, "Niedrige Kritikalitaet", size=9, color=MUTED, font=MONO)
    s.text(5.9, 4.15, 3.7, 0.22, "Hohe Kritikalitaet", size=9, color=MUTED, font=MONO)
    s.rect(6.45, 2.45, 1.95, 0.78, fill=BLACK)
    s.text(6.75, 2.66, 1.3, 0.18, "CAREVO", size=12, color=WHITE, bold=True, align="ctr")
    s.text(10.28, 2.0, 1.2, 0.2, "hoch", size=8, color=MUTED, font=MONO, align="ctr")
    s.text(10.28, 5.4, 1.2, 0.2, "niedrig", size=8, color=MUTED, font=MONO, align="ctr")
    s.text(0.86, 5.92, 9.6, 0.2, "Achsen als Platzhalter: Produktkategorien nach Due Diligence einsetzen.", size=7.5, color=MUTED, font=MONO)
    slides.append(s)

    s = Slide("Market Sizing", 7)
    common_header(s, "Markt", "Market Sizing wird als logische Ableitung statt als Grosszahl verkauft", 13)
    labels = ["TAM", "SAM", "SOM", "Pilot", "Expansion"]
    vals = [100, 62, 28, 8, 20]
    bar_chart(s, 1.1, 2.2, 7.0, 2.65, labels, vals)
    s.rect(8.8, 1.95, 2.8, 2.9, fill=SURFACE, line=BORDER)
    s.text(9.05, 2.18, 2.25, 0.18, "MODELLIERUNG", size=7, color=TEAL, font=MONO, bold=True)
    s.bullets(9.05, 2.62, 2.2, 1.2, ["Pflege- und Versorgungseinheiten", "Dokumentationsfaelle pro Monat", "Preis pro Workflow-Sitz"], size=8.6)
    s.text(1.1, 5.55, 8.4, 0.2, "Alle Zahlen sind Beispielwerte und fuer das echte Modell zu ersetzen.", size=7.5, color=MUTED, font=MONO)
    slides.append(s)

    s = Slide("Segment Scoring", 9)
    common_header(s, "Segmentierung", "Priorisierung folgt Schwere des Problems und Umsetzbarkeit", 14)
    table(
        s,
        0.82,
        1.72,
        [2.1, 1.4, 1.5, 1.5, 1.6, 2.2],
        0.5,
        ["Segment", "Pain", "Budget", "IT Fit", "Cycle", "Implikation"],
        [
            ["Ambulante Pflege", "hoch", "mittel", "hoch", "kurz", "Pilot-Fokus"],
            ["Stationaere Pflege", "hoch", "hoch", "mittel", "mittel", "Expansion"],
            ["Praxen", "mittel", "mittel", "hoch", "kurz", "Low-touch"],
            ["Kliniken", "hoch", "hoch", "niedrig", "lang", "Enterprise"],
            ["Versorgungstraeger", "mittel", "hoch", "mittel", "mittel", "Partner"],
            ["Spezialanbieter", "niedrig", "mittel", "hoch", "kurz", "Selektiv"],
        ],
    )
    slides.append(s)

    s = Slide("Competitive Landscape", 9)
    common_header(s, "Wettbewerb", "CAREVO differenziert ueber Workflow-Verantwortung, nicht ueber einzelne AI-Features", 15)
    table(
        s,
        0.82,
        1.72,
        [2.15, 2.2, 2.2, 2.2, 2.0],
        0.48,
        ["Anbieter-Typ", "AI Draft", "Workflow", "Reviewbarkeit", "CAREVO Vorteil"],
        [
            ["Manuelle Doku", "nein", "fragmentiert", "hoch", "Zeithebel"],
            ["Diktat-Tools", "teilweise", "punktuell", "mittel", "End-to-End"],
            ["Horizontale AI", "ja", "niedrig", "niedrig", "Vertical Trust"],
            ["Legacy EHR", "nein", "hoch", "hoch", "Usability"],
            ["CAREVO", "ja", "hoch", "hoch", "ruhig + pruefbar"],
        ],
    )
    slides.append(s)

    s = Slide("Positioning Map", 10)
    common_header(s, "Positionierung", "Die strategische Luecke liegt zwischen AI-Speed und klinischer Kontrolle", 16)
    s.rect(1.25, 1.78, 8.4, 4.2, fill=WHITE, line=BORDER)
    s.rect(1.25, 3.88, 8.4, 0.01, fill=BORDER)
    s.rect(5.45, 1.78, 0.01, 4.2, fill=BORDER)
    points = [
        (2.15, 4.95, "Manual"),
        (3.45, 3.25, "Dictation"),
        (6.25, 4.45, "Horizontal AI"),
        (7.35, 2.45, "CAREVO"),
    ]
    for x, y, label in points:
        fill = BLACK if label == "CAREVO" else SURFACE
        color = WHITE if label == "CAREVO" else SECONDARY
        s.rect(x, y, 1.28, 0.48, fill=fill, line=BORDER if label != "CAREVO" else None)
        s.text(x + 0.08, y + 0.15, 1.1, 0.14, label, size=7.3, color=color, font=MONO, bold=True, align="ctr")
    s.text(4.05, 6.16, 2.6, 0.16, "AI Automatisierung ->", size=8, color=MUTED, font=MONO, align="ctr")
    s.text(10.05, 2.15, 1.2, 0.16, "Kontrolle", size=8, color=MUTED, font=MONO, align="ctr")
    s.text(10.05, 5.55, 1.2, 0.16, "Geschwindigkeit", size=8, color=MUTED, font=MONO, align="ctr")
    slides.append(s)

    s = Slide("Business Model", 6)
    common_header(s, "Business Model", "Preismodell kann von Pilot zu Enterprise ohne Designbruch wachsen", 17)
    card(s, 0.82, 1.82, 3.35, 2.0, "Pilot", "Team / Monat", "Schneller Einstieg mit klarer Workflowschale, begrenzter Nutzerzahl und Templates.")
    card(s, 4.45, 1.82, 3.35, 2.0, "Scale", "Sitz + Nutzung", "Mehr Teams, Export-Volumen, Vorlagen-Versionierung und Reporting.")
    card(s, 8.08, 1.82, 3.35, 2.0, "Enterprise", "Plattform", "SLA, Audit, Integrationen, Custom Templates und Admin-Kontrollen.")
    s.rect(0.82, 4.48, 10.62, 0.82, fill=BLACK)
    s.text(1.1, 4.72, 9.9, 0.22, "Investor Lens: Revenue expandiert entlang von Nutzung, Compliance und organisatorischer Tiefe.", size=12.4, color=WHITE, bold=True)
    slides.append(s)

    s = Slide("Unit Economics", 7)
    common_header(s, "Economics", "Unit Economics werden als Bruecke aus Zeitersparnis und Nutzungsdichte modelliert", 18)
    bar_chart(s, 1.05, 2.08, 5.2, 2.4, ["Seats", "Usage", "ARPA", "GM"], [35, 62, 78, 84])
    s.rect(7.1, 1.88, 4.05, 2.92, fill=WHITE, line=BORDER)
    s.text(7.35, 2.12, 3.55, 0.22, "Modellannahmen", size=13, color=BLACK, bold=True)
    s.bullets(7.35, 2.58, 3.2, 1.2, ["Preis je aktiver Workflow-Einheit", "Nutzungsdichte pro Team", "Supportkosten sinken mit Template-Reife", "Compliance als Enterprise-Upsell"], size=9)
    s.text(1.05, 5.55, 8.0, 0.2, "Beispielwerte; echte Daten aus Produktanalytics und Pilotkohorten einsetzen.", size=7.5, color=MUTED, font=MONO)
    slides.append(s)

    s = Slide("KPI Dashboard", 8)
    common_header(s, "Dashboard", "Ein VC-taugliches Dashboard trennt Adoption, Qualitaet und Wirtschaftlichkeit", 19)
    metrics = [
        ("Adoption", "124", "aktive Teams"),
        ("Usage", "8.4k", "Workflows / Monat"),
        ("Quality", "92%", "ohne Warnung"),
        ("Speed", "58s", "Draft zu Review"),
        ("Retention", "XX%", "Logo / Net"),
        ("GM", "XX%", "Platzhalter"),
    ]
    for i, m in enumerate(metrics):
        x = 0.82 + (i % 3) * 3.58
        y = 1.82 + (i // 3) * 1.48
        metric(s, x, y, 3.12, 1.1, *m)
    s.rect(0.82, 5.08, 10.3, 0.42, fill=SURFACE, line=BORDER)
    s.text(1.05, 5.2, 9.7, 0.14, "Dashboard-Sprache: nur Kennzahlen zeigen, die eine Entscheidung ausloesen koennen.", size=8, color=SECONDARY, font=MONO)
    slides.append(s)

    s = Slide("Traction Dashboard", 8)
    common_header(s, "Traction", "Traktion sollte als Pipeline von Lernen zu Wiederholbarkeit gelesen werden", 20)
    bar_chart(s, 0.95, 2.0, 5.1, 2.2, ["M1", "M2", "M3", "M4", "M5", "M6"], [12, 18, 31, 45, 61, 80])
    table(
        s,
        6.55,
        1.84,
        [1.75, 1.15, 1.15, 1.4],
        0.43,
        ["Kohorte", "Pilot", "Paid", "Status"],
        [
            ["Q1 Pflege", "8", "3", "lernen"],
            ["Q2 Praxis", "12", "5", "wiederholen"],
            ["Q3 Klinik", "4", "1", "enterprise"],
            ["Partner", "6", "2", "channel"],
        ],
    )
    s.text(0.95, 5.55, 10.4, 0.2, "Beispielwerte; Pipeline-Struktur bleibt, Daten werden ersetzt.", size=7.5, color=MUTED, font=MONO)
    slides.append(s)

    s = Slide("GTM Motion", 12)
    common_header(s, "Go-to-Market", "GTM kombiniert Pilot-Sicherheit mit Enterprise-Ausbau", 21)
    process(s, 0.82, 1.95, 10.9, ["Design Partner", "Pilot", "Template Fit", "Rollout", "Expansion"])
    card(s, 0.82, 3.58, 3.2, 1.45, "Motion", "Low friction entry", "Kurzer Wertnachweis ueber dokumentierte Workflows.")
    card(s, 4.25, 3.58, 3.2, 1.45, "Proof", "Quality gate", "Freigaben, Warnungen und Exporte als Aktivierungsmetriken.")
    card(s, 7.68, 3.58, 3.2, 1.45, "Expansion", "Org depth", "Templates, Admin, Integrationen und Reporting.")
    slides.append(s)

    s = Slide("Sales Motion", 11)
    common_header(s, "Sales Motion", "Vom ersten Team zum Organisationsvertrag braucht es klare Gates", 22)
    milestones = [("Woche 0", "Demo"), ("Woche 2", "Pilot"), ("Woche 6", "Review"), ("Woche 10", "Rollout"), ("Woche 16", "Expansion")]
    x0, y0 = 1.0, 3.0
    s.rect(x0, y0 + 0.32, 9.8, 0.03, fill=BORDER)
    for i, (t, b) in enumerate(milestones):
        x = x0 + i * 2.25
        s.rect(x, y0 + 0.18, 0.32, 0.32, fill=TEAL)
        s.text(x - 0.26, y0 - 0.3, 0.84, 0.16, t, size=7, color=MUTED, font=MONO, align="ctr")
        s.text(x - 0.55, y0 + 0.66, 1.4, 0.18, b, size=10, color=BLACK, bold=True, align="ctr")
    s.rect(1.0, 4.75, 9.78, 0.55, fill=SURFACE, line=BORDER)
    s.text(1.25, 4.91, 9.2, 0.16, "Jedes Gate hat ein klares Entscheidungskriterium: Nutzung, Qualitaet, Compliance, Erweiterbarkeit.", size=8.2, color=SECONDARY, font=MONO)
    slides.append(s)

    s = Slide("Customer Proof", 14)
    common_header(s, "Proof", "Kundenbeweise sollten Stimmen, Workflowdaten und Entscheidungskriterien trennen", 23)
    s.rect(0.9, 1.9, 4.8, 2.6, fill=BLACK)
    s.text(1.22, 2.25, 4.0, 0.72, "Wir sehen sofort, ob eine Notiz noch Entwurf ist oder freigegeben wurde.", size=21, color=WHITE, bold=True, italic=True)
    s.text(1.24, 3.7, 3.6, 0.18, "Beispielzitat - durch echte Referenz ersetzen", size=7.2, color=MUTED, font=MONO)
    card(s, 6.25, 1.9, 2.55, 1.12, "Proof", "Adoption", "Aktive Nutzer je Einrichtung.")
    card(s, 9.05, 1.9, 2.55, 1.12, "Proof", "Quality", "Freigabe ohne Nacharbeit.")
    card(s, 6.25, 3.38, 2.55, 1.12, "Proof", "Retention", "Wiederkehrende Workflows.")
    card(s, 9.05, 3.38, 2.55, 1.12, "Proof", "Expansion", "Weitere Teams und Templates.")
    slides.append(s)

    s = Slide("Product Architecture", 13)
    common_header(s, "Produkt", "Die Architektur folgt der sichtbaren Workflowschale", 24)
    layers = [
        ("App Shell", "Navigation, Status, Suche, Rollen"),
        ("Workflow State", "Recording, Draft, Validation, Approval"),
        ("AI Services", "Transcription, Note Draft, Voice Edit"),
        ("Data & Audit", "Supabase, Jobs, Export, Logs"),
    ]
    for i, (title, body) in enumerate(layers):
        y = 1.75 + i * 0.85
        s.rect(1.1, y, 9.8, 0.58, fill=WHITE if i % 2 else SURFACE, line=BORDER)
        s.text(1.34, y + 0.15, 2.1, 0.15, title.upper(), size=7, color=TEAL, font=MONO, bold=True)
        s.text(3.55, y + 0.13, 6.8, 0.18, body, size=9.2, color=BLACK, bold=True)
    s.text(1.1, 5.55, 8.8, 0.22, "Consulting-Logik: Architektur wird als Kontrollsystem erklaert, nicht als Technikliste.", size=8, color=MUTED, font=MONO)
    slides.append(s)

    s = Slide("AI Quality", 6)
    common_header(s, "AI Quality", "Qualitaet wird ueber sichtbare Warnungen und Review-Schritte operationalisiert", 25)
    checks = [
        ("Luecken", "Plan Section Empty"),
        ("Nachweis", "Medication missing from transcript"),
        ("Klarheit", "Unclear diagnosis wording"),
        ("Follow-up", "Missing next step"),
        ("Edit", "Voice edit preview before apply"),
        ("Export", "Only after approval"),
    ]
    for i, (t, b) in enumerate(checks):
        x = 0.82 + (i % 3) * 3.45
        y = 1.82 + (i // 3) * 1.46
        card(s, x, y, 3.05, 1.08, "Guardrail", t, b)
    slides.append(s)

    s = Slide("Compliance Trust", 9)
    common_header(s, "Compliance", "Trust by Design braucht klare Verantwortlichkeiten je Risiko", 26)
    table(
        s,
        0.82,
        1.72,
        [2.2, 2.2, 2.2, 2.2, 1.6],
        0.5,
        ["Risiko", "Kontrolle", "Owner", "Artefakt", "Status"],
        [
            ["AI hallucination", "Validation warnings", "Clinical", "Risk register", "open"],
            ["Data leakage", "Access policy", "Security", "Audit logs", "draft"],
            ["Bad export", "Approval gate", "Product", "Export trail", "ready"],
            ["Model drift", "Change process", "AI lead", "Incident log", "planned"],
            ["User error", "Clear states", "Design", "UX checklist", "ready"],
        ],
    )
    slides.append(s)

    s = Slide("Security Posture", 6)
    common_header(s, "Security", "Security-Kommunikation muss ruhig, konkret und pruefbar bleiben", 27)
    card(s, 0.82, 1.84, 3.35, 1.9, "Layer 01", "Access", "Admin policies, Teamrollen und Deaktivierungsprozesse.")
    card(s, 4.45, 1.84, 3.35, 1.9, "Layer 02", "Data", "Backups, Restore Runbook und Secret Rotation.")
    card(s, 8.08, 1.84, 3.35, 1.9, "Layer 03", "Monitoring", "KPIs, Incident-Prozess und Rollback-Protokoll.")
    s.rect(0.82, 4.45, 10.62, 0.72, fill=SURFACE, line=BORDER)
    s.text(1.08, 4.66, 10.0, 0.18, "Kein Security-Theater: jedes Claim braucht Artefakt, Owner und pruefbaren Prozess.", size=9, color=SECONDARY, font=MONO)
    slides.append(s)

    s = Slide("Team Org", 15)
    common_header(s, "Team", "Organisation wird als Operating Model mit klaren Verantwortlichkeiten gezeigt", 28)
    roles = [("CEO", "Category & Capital"), ("CPO", "Workflow & UX"), ("CTO", "Platform & Security"), ("Clinical", "Quality & Review"), ("GTM", "Pilots & Expansion")]
    for i, (role, sub) in enumerate(roles):
        x = 0.95 + i * 2.18
        s.rect(x, 2.05, 1.65, 1.1, fill=WHITE, line=BORDER)
        s.text(x + 0.12, 2.32, 1.4, 0.22, role, size=13, color=BLACK, bold=True, align="ctr")
        s.text(x + 0.1, 2.72, 1.45, 0.2, sub, size=6.6, color=MUTED, font=MONO, align="ctr")
    s.rect(1.75, 4.05, 7.95, 0.66, fill=BLACK)
    s.text(2.05, 4.26, 7.3, 0.18, "Board Narrative: Das Team deckt Produkt, Klinik, Compliance und Vertrieb ab.", size=10.2, color=WHITE, bold=True)
    slides.append(s)

    s = Slide("Product Roadmap", 11)
    common_header(s, "Roadmap", "Roadmap zeigt Entscheidungslogik statt Feature-Liste", 29)
    phases = [("Now", "Workflow hardening\nValidation UX\nPilot readiness"), ("Next", "Template manager\nExports\nTeam billing"), ("Later", "Integrations\nAnalytics\nEnterprise admin")]
    for i, (phase, body) in enumerate(phases):
        x = 0.92 + i * 3.55
        s.rect(x, 1.9, 3.1, 2.45, fill=WHITE, line=BORDER)
        s.text(x + 0.2, 2.16, 1.2, 0.2, phase.upper(), size=8, color=TEAL, font=MONO, bold=True)
        s.text(x + 0.2, 2.58, 2.55, 1.0, body, size=14, color=BLACK, bold=True)
    s.rect(0.92, 5.05, 10.2, 0.5, fill=SURFACE, line=BORDER)
    s.text(1.16, 5.2, 9.6, 0.14, "Jede Phase braucht ein messbares Gate: Adoption, Quality, Revenue oder Compliance.", size=8, color=SECONDARY, font=MONO)
    slides.append(s)

    s = Slide("100 Day Plan", 11)
    common_header(s, "Plan", "Die ersten 100 Tage muessen Risiko abbauen und Wiederholbarkeit erhoehen", 30)
    table(
        s,
        0.82,
        1.74,
        [1.5, 3.0, 3.0, 2.3],
        0.52,
        ["Phase", "Fokus", "Deliverable", "Metric"],
        [
            ["0-30", "Pilot hardening", "Review workflow", "Activation"],
            ["31-60", "Quality system", "Validation library", "Warning rate"],
            ["61-90", "GTM repeatability", "Pilot playbook", "Conversion"],
            ["91-100", "Board pack", "Metrics baseline", "Decision"],
        ],
    )
    slides.append(s)

    s = Slide("Fundraising Ask", 7)
    common_header(s, "Fundraising", "Use of Proceeds wird in konkrete Werttreiber uebersetzt", 31)
    segments = [("Product", 38, TEAL), ("Clinical Quality", 24, SECONDARY), ("Security", 18, MUTED), ("GTM", 20, BLACK)]
    x = 1.0
    total_w = 7.2
    for label, value, color in segments:
        ww = total_w * value / 100
        s.rect(x, 2.3, ww, 0.52, fill=color)
        s.text(x, 3.0, ww, 0.18, f"{label}\n{value}%", size=7.3, color=SECONDARY, font=MONO, align="ctr")
        x += ww
    s.rect(8.85, 1.8, 2.75, 2.4, fill=WHITE, line=BORDER)
    s.text(9.1, 2.05, 2.2, 0.22, "Milestones", size=13, color=BLACK, bold=True)
    s.bullets(9.1, 2.5, 2.1, 0.9, ["10 design partners", "Quality baseline", "Repeatable pilot", "Enterprise path"], size=8.8)
    s.text(1.0, 5.4, 8.7, 0.2, "Betrag und Runway als Platzhalter einsetzen.", size=7.5, color=MUTED, font=MONO)
    slides.append(s)

    s = Slide("Risk Register", 9)
    common_header(s, "Risiken", "Gute VC-Folien zeigen Risiken frueh und operativ beherrschbar", 32)
    table(
        s,
        0.82,
        1.72,
        [2.0, 2.4, 2.4, 2.0, 1.4],
        0.48,
        ["Risiko", "Signal", "Mitigation", "Owner", "Status"],
        [
            ["Clinical quality", "Nacharbeit steigt", "Validation + review", "Clinical", "amber"],
            ["Sales cycle", "Pilot stagniert", "Gate metrics", "GTM", "open"],
            ["Integration", "Export blockiert", "API roadmap", "CTO", "planned"],
            ["Trust", "AI Skepsis", "Human-in-loop", "Product", "ready"],
            ["Compliance", "Audit gap", "Operating model", "Ops", "open"],
        ],
    )
    slides.append(s)

    s = Slide("Scenario Planning", 9)
    common_header(s, "Szenarien", "Szenario-Folien machen Annahmen sichtbar und entscheidbar", 33)
    table(
        s,
        0.82,
        1.76,
        [2.0, 2.5, 2.5, 2.5],
        0.55,
        ["Szenario", "Trigger", "Outcome", "Board Action"],
        [
            ["Base", "Pilot repeatable", "Seed-ready", "Fundraise"],
            ["Upside", "Enterprise pull", "Higher ACV", "Accelerate GTM"],
            ["Downside", "Quality variance", "Longer pilots", "Narrow segment"],
            ["Pivot", "Integration demand", "Platform motion", "Partner channel"],
        ],
    )
    slides.append(s)

    s = Slide("Appendix Divider", 2, bg=BLACK)
    s.rect(0, 0, 0.055, SLIDE_H, fill=TEAL)
    s.text(0.82, 0.78, 2.4, 0.2, "APPENDIX", size=8, color=MUTED, font=MONO, bold=True)
    s.text(0.82, 2.22, 7.3, 1.15, "Designsystem,\nMaster und Bausteine.", size=42, color=WHITE, bold=True)
    s.rect(0.82, 4.05, 4.6, 0.02, fill=TEAL)
    s.text(0.82, 4.42, 6.8, 0.42, "Backup-Folien fuer Brand, Farben, Typografie, Grid und Komponenten.", size=14, color=MUTED)
    footer(s, 34, dark=True)
    slides.append(s)

    s = Slide("Color System", 16)
    common_header(s, "Appendix", "Farben sind exakt aus den CAREVO Design-Dateien uebernommen", 35)
    swatches = [
        ("Tiefschwarz", BLACK, "Primaer / Verantwortung"),
        ("Reinweiss", WHITE, "Hintergrund / Klarheit"),
        ("Medizinblaugruen", TEAL, "Akzent / Aktion"),
        ("Surface", SURFACE, "Flaechen"),
        ("Border", BORDER, "Linien"),
        ("Muted", MUTED, "Hilfstext"),
        ("Secondary", SECONDARY, "Body / Labels"),
        ("Error", ERROR, "Kritisch"),
    ]
    for i, (name, c, note) in enumerate(swatches):
        x = 0.82 + (i % 4) * 2.75
        y = 1.78 + (i // 4) * 1.75
        s.rect(x, y, 2.25, 0.78, fill=c, line=BORDER if c == WHITE else None)
        s.text(x, y + 0.96, 2.25, 0.18, f"#{c}", size=7, color=MUTED, font=MONO)
        s.text(x, y + 1.2, 2.25, 0.18, name, size=10, color=BLACK, bold=True)
        s.text(x, y + 1.42, 2.25, 0.15, note, size=6.5, color=MUTED, font=MONO)
    slides.append(s)

    s = Slide("Typography Grid", 16)
    common_header(s, "Appendix", "Typografie nutzt Helvetica und Courier als PowerPoint-sichere Brand-Umsetzung", 36)
    s.rect(0.82, 1.75, 5.1, 1.25, fill=SURFACE, line=BORDER)
    s.text(1.05, 2.05, 4.4, 0.36, "Helvetica", size=22, color=BLACK, bold=True)
    s.text(1.05, 2.52, 4.4, 0.16, "Primaere Schrift - alle Interface- und Pitch-Texte", size=7.5, color=MUTED, font=MONO)
    s.rect(6.35, 1.75, 5.1, 1.25, fill=SURFACE, line=BORDER)
    s.text(6.58, 2.05, 4.4, 0.36, "Courier", size=22, color=BLACK, bold=True, font=MONO)
    s.text(6.58, 2.52, 4.4, 0.16, "Monospace - Daten, Hex-Codes und Labels", size=7.5, color=MUTED, font=MONO)
    sizes = [72, 48, 32, 22, 16, 13, 11]
    for i, size_val in enumerate(sizes):
        y = 3.55 + i * 0.35
        s.text(0.9, y, 1.0, 0.18, f"{size_val}px", size=7, color=TEAL, font=MONO, bold=True)
        s.text(2.0, y - 0.03, 4.3, 0.22, "Scale sample", size=min(size_val * 0.28, 20), color=BLACK, bold=True)
    s.rect(7.2, 3.55, 3.7, 1.65, fill=WHITE, line=BORDER)
    s.text(7.45, 3.82, 3.1, 0.22, "8px Raster", size=14, color=BLACK, bold=True)
    s.text(7.45, 4.25, 3.0, 0.35, "Abstaende in Vielfachen von 8px; im Deck als konsistenter Punkt-/Inch-Rhythmus umgesetzt.", size=9, color=SECONDARY)
    slides.append(s)

    s = Slide("Component Library", 16)
    common_header(s, "Appendix", "Komponenten bleiben ruhig: Buttons, Karten, Tabellen und Status", 37)
    s.rect(0.9, 1.95, 1.6, 0.38, fill=TEAL)
    s.text(1.1, 2.06, 1.2, 0.12, "Primary CTA", size=7.5, color=WHITE, bold=True, align="ctr")
    s.rect(2.8, 1.95, 1.55, 0.38, fill=WHITE, line=BLACK)
    s.text(3.02, 2.06, 1.1, 0.12, "Secondary", size=7.5, color=BLACK, align="ctr")
    s.rect(4.65, 1.95, 1.55, 0.38, fill=WHITE, line=BORDER)
    s.text(4.88, 2.06, 1.05, 0.12, "Ghost", size=7.5, color=SECONDARY, align="ctr")
    card(s, 0.9, 2.92, 3.1, 1.45, "Feature Card", "Beratungsdoku", "Audio -> Entwurf -> Freigabe in einem pruefbaren Flow.")
    table(
        s,
        4.55,
        2.92,
        [1.5, 1.35, 1.35, 1.3],
        0.4,
        ["Item", "Status", "Owner", "Date"],
        [["Draft", "open", "Ops", "T+1"], ["Review", "ready", "Clinical", "T+3"], ["Export", "blocked", "IT", "T+5"]],
    )
    slides.append(s)

    s = Slide("Master Usage", 16)
    common_header(s, "Appendix", "So werden die Master-Folien im Arbeitsalltag genutzt", 38)
    s.rect(0.9, 1.85, 4.9, 3.2, fill=WHITE, line=BORDER)
    s.text(1.15, 2.12, 4.4, 0.24, "Do", size=15, color=BLACK, bold=True)
    s.bullets(1.15, 2.58, 4.0, 1.35, ["Takeaway-Headlines schreiben.", "Nur CAREVO Farben nutzen.", "Fussnoten und Quellen sauber platzieren.", "Tabellen klar statt dekorativ bauen."], size=9.5)
    s.rect(6.25, 1.85, 4.9, 3.2, fill=WHITE, line=BORDER)
    s.text(6.5, 2.12, 4.4, 0.24, "Do not", size=15, color=BLACK, bold=True)
    s.bullets(6.5, 2.58, 4.0, 1.35, ["Keine Gradients oder Schmuckformen.", "Keine bunten Ersatzpaletten.", "Keine Stock-Foto-Aesthetik.", "Keine unklaren AI-Claims ohne Reviewbezug."], size=9.5)
    s.rect(0.9, 5.55, 10.25, 0.44, fill=SURFACE, line=BORDER)
    s.text(1.16, 5.68, 9.7, 0.14, "Die Layouts sind in PowerPoint als Slide Layouts abgelegt und koennen fuer neue Folien genutzt werden.", size=8, color=SECONDARY, font=MONO)
    slides.append(s)

    s = Slide("Closing", 17, bg=BLACK)
    s.rect(0, 0, 0.055, SLIDE_H, fill=TEAL)
    logo(s, 0.82, 0.72, dark=True)
    s.text(0.82, 2.05, 8.2, 1.5, "Ruhig im Auftritt.\nKlar in der Verantwortung.", size=42, color=WHITE, bold=True)
    s.rect(0.82, 4.46, 4.45, 0.02, fill=TEAL)
    s.text(0.82, 4.88, 6.6, 0.4, "CAREVO wurde nicht fuer Demos entworfen, sondern fuer Fachkraefte, die jeden Tag unter Dokumentationslast arbeiten.", size=13.5, color=MUTED)
    footer(s, 39, dark=True)
    slides.append(s)

    return slides


def placeholder_shape(shape_id: int, name: str, ph_type: str, idx: int, x: float, y: float, w: float, h: float, label: str, size_text: float = 12) -> str:
    return (
        "<p:sp>"
        "<p:nvSpPr>"
        f'<p:cNvPr id="{shape_id}" name="{xml(name)}"/>'
        '<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
        f'<p:nvPr><p:ph type="{ph_type}" idx="{idx}"/></p:nvPr>'
        "</p:nvSpPr>"
        "<p:spPr>"
        f'<a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/><a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
        "<a:noFill/>"
        f"{line_xml(BORDER, 0.4)}"
        "</p:spPr>"
        "<p:txBody>"
        f'<a:bodyPr wrap="square" anchor="ctr" lIns="{emu(0.04)}" rIns="{emu(0.04)}" tIns="{emu(0.04)}" bIns="{emu(0.04)}"/>'
        "<a:lstStyle/>"
        f'{paragraph_xml(label, size=size_text, color=MUTED, font=FONT, align="ctr")}'
        "</p:txBody>"
        "</p:sp>"
    )


def slide_layout_xml(layout_name: str, index: int) -> str:
    dark = index in {2, 17}
    bg = BLACK if dark else WHITE
    text_color = WHITE if dark else BLACK
    shapes = [
        "<p:nvGrpSpPr><p:cNvPr id=\"1\" name=\"\"/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>",
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>',
        (
            "<p:sp><p:nvSpPr><p:cNvPr id=\"2\" name=\"Layout accent\"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>"
            f'<p:spPr><a:xfrm><a:off x="{emu(0)}" y="{emu(0)}"/><a:ext cx="{emu(0.045)}" cy="{emu(SLIDE_H)}"/></a:xfrm>'
            '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>'
            f"{color_fill(TEAL)}{line_xml(None)}</p:spPr><p:style/></p:sp>"
        ),
    ]
    if index == 1:
        shapes.append(placeholder_shape(3, "Title Placeholder", "ctrTitle", 1, 0.75, 2.0, 7.2, 0.8, "Cover Title", 22))
        shapes.append(placeholder_shape(4, "Subtitle Placeholder", "subTitle", 2, 0.75, 2.95, 6.2, 0.45, "Subtitle", 12))
    elif index == 2:
        shapes.append(placeholder_shape(3, "Section Title", "title", 1, 0.78, 2.1, 8.0, 1.2, "Section Divider", 26))
    else:
        shapes.append(placeholder_shape(3, "Headline", "title", 1, 0.62, 0.82, 10.6, 0.58, "Slide Headline", 16))
        if index in {3, 4, 14}:
            shapes.append(placeholder_shape(4, "Big Message", "body", 2, 0.82, 1.75, 6.3, 1.4, "Key message", 18))
            shapes.append(placeholder_shape(5, "Support", "body", 3, 7.55, 1.75, 3.8, 2.2, "Supporting proof", 12))
        elif index in {5, 13}:
            shapes.append(placeholder_shape(4, "Left Content", "body", 2, 0.82, 1.7, 5.1, 3.8, "Left content", 12))
            shapes.append(placeholder_shape(5, "Right Content", "body", 3, 6.35, 1.7, 5.1, 3.8, "Right content", 12))
        elif index in {6, 8}:
            for i in range(6 if index == 8 else 3):
                x = 0.82 + (i % 3) * 3.45
                y = 1.78 + (i // 3) * 1.45
                shapes.append(placeholder_shape(4 + i, f"Card {i+1}", "body", 2 + i, x, y, 3.0, 1.05, f"Card {i+1}", 10))
        elif index in {7, 9}:
            shapes.append(placeholder_shape(4, "Data Area", "body", 2, 0.82, 1.7, 10.4, 4.2, "Chart / Table Area", 12))
        elif index == 10:
            shapes.append(placeholder_shape(4, "Matrix", "body", 2, 1.25, 1.75, 8.4, 4.2, "2x2 Matrix", 13))
        elif index in {11, 12}:
            shapes.append(placeholder_shape(4, "Timeline", "body", 2, 0.82, 2.0, 10.9, 1.1, "Timeline / Process", 12))
        elif index == 15:
            shapes.append(placeholder_shape(4, "Org", "body", 2, 0.82, 1.8, 10.4, 3.8, "Team / Org", 12))
        else:
            shapes.append(placeholder_shape(4, "Content", "body", 2, 0.82, 1.7, 10.4, 4.2, "Content Area", 12))

    shapes.append(
        "<p:sp><p:nvSpPr><p:cNvPr id=\"90\" name=\"Layout label\"/><p:cNvSpPr txBox=\"1\"/><p:nvPr/></p:nvSpPr>"
        f'<p:spPr><a:xfrm><a:off x="{emu(0.62)}" y="{emu(7.12)}"/><a:ext cx="{emu(5.4)}" cy="{emu(0.18)}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr>'
        "<p:txBody>"
        f'<a:bodyPr wrap="square" lIns="{emu(0)}" rIns="{emu(0)}" tIns="{emu(0)}" bIns="{emu(0)}"/>'
        "<a:lstStyle/>"
        f'{paragraph_xml(layout_name, size=6.5, color=MUTED, font=MONO)}'
        "</p:txBody></p:sp>"
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<p:sldLayout xmlns:a="{NS["a"]}" xmlns:r="{NS["r"]}" xmlns:p="{NS["p"]}" type="obj" preserve="1">'
        f'<p:cSld name="{xml(layout_name)}">'
        "<p:bg><p:bgPr>"
        f'<a:solidFill><a:srgbClr val="{bg}"/></a:solidFill><a:effectLst/>'
        "</p:bgPr></p:bg>"
        "<p:spTree>"
        f"{''.join(shapes)}"
        "</p:spTree>"
        "</p:cSld>"
        "<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>"
        "</p:sldLayout>"
    ).replace(f'val="{text_color}"', f'val="{text_color}"')


def slide_master_xml() -> str:
    layout_ids = "".join(
        f'<p:sldLayoutId id="{2147483649 + i}" r:id="rId{i + 1}"/>'
        for i in range(len(LAYOUTS))
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<p:sldMaster xmlns:a="{NS["a"]}" xmlns:r="{NS["r"]}" xmlns:p="{NS["p"]}">'
        '<p:cSld name="CAREVO Master">'
        "<p:bg><p:bgPr>"
        f'<a:solidFill><a:srgbClr val="{WHITE}"/></a:solidFill>'
        "<a:effectLst/>"
        "</p:bgPr></p:bg>"
        "<p:spTree>"
        '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
        '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
        "</p:spTree>"
        "</p:cSld>"
        '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>'
        f"<p:sldLayoutIdLst>{layout_ids}</p:sldLayoutIdLst>"
        "<p:txStyles>"
        "<p:titleStyle><a:lvl1pPr algn=\"l\"><a:defRPr sz=\"2400\" b=\"1\"><a:solidFill><a:schemeClr val=\"tx1\"/></a:solidFill><a:latin typeface=\"Helvetica\"/></a:defRPr></a:lvl1pPr></p:titleStyle>"
        "<p:bodyStyle><a:lvl1pPr algn=\"l\"><a:defRPr sz=\"1200\"><a:solidFill><a:schemeClr val=\"tx1\"/></a:solidFill><a:latin typeface=\"Helvetica\"/></a:defRPr></a:lvl1pPr></p:bodyStyle>"
        "<p:otherStyle><a:lvl1pPr algn=\"l\"><a:defRPr sz=\"1000\"><a:solidFill><a:schemeClr val=\"tx2\"/></a:solidFill><a:latin typeface=\"Helvetica\"/></a:defRPr></a:lvl1pPr></p:otherStyle>"
        "</p:txStyles>"
        "</p:sldMaster>"
    )


def theme_xml() -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<a:theme xmlns:a="{NS["a"]}" name="CAREVO VC Consulting Theme">'
        "<a:themeElements>"
        '<a:clrScheme name="CAREVO">'
        f'<a:dk1><a:srgbClr val="{BLACK}"/></a:dk1>'
        f'<a:lt1><a:srgbClr val="{WHITE}"/></a:lt1>'
        f'<a:dk2><a:srgbClr val="{SECONDARY}"/></a:dk2>'
        f'<a:lt2><a:srgbClr val="{SURFACE}"/></a:lt2>'
        f'<a:accent1><a:srgbClr val="{TEAL}"/></a:accent1>'
        f'<a:accent2><a:srgbClr val="{MUTED}"/></a:accent2>'
        f'<a:accent3><a:srgbClr val="{BORDER}"/></a:accent3>'
        f'<a:accent4><a:srgbClr val="{ERROR}"/></a:accent4>'
        f'<a:accent5><a:srgbClr val="{BLACK}"/></a:accent5>'
        f'<a:accent6><a:srgbClr val="{SECONDARY}"/></a:accent6>'
        f'<a:hlink><a:srgbClr val="{TEAL}"/></a:hlink>'
        f'<a:folHlink><a:srgbClr val="{SECONDARY}"/></a:folHlink>'
        "</a:clrScheme>"
        '<a:fontScheme name="CAREVO Fonts">'
        '<a:majorFont><a:latin typeface="Helvetica"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>'
        '<a:minorFont><a:latin typeface="Helvetica"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>'
        "</a:fontScheme>"
        '<a:fmtScheme name="CAREVO Format">'
        '<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>'
        '<a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>'
        '<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>'
        '<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>'
        "</a:fmtScheme>"
        "</a:themeElements>"
        "<a:objectDefaults/>"
        "<a:extraClrSchemeLst/>"
        "</a:theme>"
    )


def presentation_xml(slide_count: int) -> str:
    slide_ids = "".join(
        f'<p:sldId id="{256 + i}" r:id="rId{i + 2}"/>'
        for i in range(slide_count)
    )
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        f'<p:presentation xmlns:a="{NS["a"]}" xmlns:r="{NS["r"]}" xmlns:p="{NS["p"]}" saveSubsetFonts="1">'
        '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
        f"<p:sldIdLst>{slide_ids}</p:sldIdLst>"
        f'<p:sldSz cx="{emu(SLIDE_W)}" cy="{emu(SLIDE_H)}" type="wide"/>'
        f'<p:notesSz cx="{emu(7.5)}" cy="{emu(10)}"/>'
        "<p:defaultTextStyle>"
        "<a:defPPr><a:defRPr lang=\"de-DE\"><a:latin typeface=\"Helvetica\"/></a:defRPr></a:defPPr>"
        "</p:defaultTextStyle>"
        "</p:presentation>"
    )


def app_xml(slide_count: int) -> str:
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" '
        'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">'
        "<Application>Microsoft PowerPoint</Application>"
        "<DocSecurity>0</DocSecurity>"
        "<ScaleCrop>false</ScaleCrop>"
        f"<Slides>{slide_count}</Slides>"
        f"<HeadingPairs><vt:vector size=\"2\" baseType=\"variant\"><vt:variant><vt:lpstr>Theme</vt:lpstr></vt:variant><vt:variant><vt:i4>1</vt:i4></vt:variant></vt:vector></HeadingPairs>"
        "<TitlesOfParts><vt:vector size=\"1\" baseType=\"lpstr\"><vt:lpstr>CAREVO VC Consulting Theme</vt:lpstr></vt:vector></TitlesOfParts>"
        "<Company>CAREVO</Company>"
        "<LinksUpToDate>false</LinksUpToDate><SharedDoc>false</SharedDoc><HyperlinksChanged>false</HyperlinksChanged><AppVersion>16.0000</AppVersion>"
        "</Properties>"
    )


def core_xml() -> str:
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
        'xmlns:dc="http://purl.org/dc/elements/1.1/" '
        'xmlns:dcterms="http://purl.org/dc/terms/" '
        'xmlns:dcmitype="http://purl.org/dc/dcmitype/" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        "<dc:title>CAREVO VC and Consulting Style PowerPoint Template</dc:title>"
        "<dc:subject>CAREVO brand-based VC / board template</dc:subject>"
        "<dc:creator>Codex</dc:creator>"
        "<cp:keywords>CAREVO; VC; Consulting; PowerPoint; Template; Slide Master</cp:keywords>"
        "<dc:description>Built from local CAREVO design files: brand guide, design philosophy, UI spec, CSS and Tailwind tokens.</dc:description>"
        "<cp:lastModifiedBy>Codex</cp:lastModifiedBy>"
        f'<dcterms:created xsi:type="dcterms:W3CDTF">{now}</dcterms:created>'
        f'<dcterms:modified xsi:type="dcterms:W3CDTF">{now}</dcterms:modified>'
        "</cp:coreProperties>"
    )


def content_types_xml(slide_count: int, main_content_type: str) -> str:
    overrides = [
        ('/docProps/app.xml', 'application/vnd.openxmlformats-officedocument.extended-properties+xml'),
        ('/docProps/core.xml', 'application/vnd.openxmlformats-package.core-properties+xml'),
        ('/ppt/presentation.xml', main_content_type),
        ('/ppt/slideMasters/slideMaster1.xml', 'application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml'),
        ('/ppt/theme/theme1.xml', 'application/vnd.openxmlformats-officedocument.theme+xml'),
        ('/ppt/presProps.xml', 'application/vnd.openxmlformats-officedocument.presentationml.presProps+xml'),
        ('/ppt/viewProps.xml', 'application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml'),
        ('/ppt/tableStyles.xml', 'application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml'),
    ]
    overrides += [
        (f'/ppt/slideLayouts/slideLayout{i}.xml', 'application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml')
        for i in range(1, len(LAYOUTS) + 1)
    ]
    overrides += [
        (f'/ppt/slides/slide{i}.xml', 'application/vnd.openxmlformats-officedocument.presentationml.slide+xml')
        for i in range(1, slide_count + 1)
    ]
    rows = "".join(f'<Override PartName="{part}" ContentType="{ctype}"/>' for part, ctype in overrides)
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        f"{rows}"
        "</Types>"
    )


def static_parts() -> dict[str, str]:
    return {
        "ppt/presProps.xml": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            f'<p:presentationPr xmlns:a="{NS["a"]}" xmlns:r="{NS["r"]}" xmlns:p="{NS["p"]}"/>'
        ),
        "ppt/viewProps.xml": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            f'<p:viewPr xmlns:a="{NS["a"]}" xmlns:r="{NS["r"]}" xmlns:p="{NS["p"]}">'
            "<p:normalViewPr><p:restoredLeft sz=\"15620\" autoAdjust=\"0\"/><p:restoredTop sz=\"94660\" autoAdjust=\"0\"/></p:normalViewPr>"
            "<p:slideViewPr><p:cSldViewPr><p:cViewPr varScale=\"1\"><p:scale><a:sx n=\"100\" d=\"100\"/><a:sy n=\"100\" d=\"100\"/></p:scale><p:origin x=\"0\" y=\"0\"/></p:cViewPr><p:guideLst/></p:cSldViewPr></p:slideViewPr>"
            "</p:viewPr>"
        ),
        "ppt/tableStyles.xml": (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            f'<a:tblStyleLst xmlns:a="{NS["a"]}" def="{BORDER}"/>'
        ),
    }


def write_package(path: Path, slides: list[Slide], *, template: bool) -> None:
    main_type = (
        "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml"
        if template
        else "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"
    )
    with ZipFile(path, "w", ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", content_types_xml(len(slides), main_type))
        zf.writestr(
            "_rels/.rels",
            rels_xml(
                [
                    ("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument", "ppt/presentation.xml"),
                    ("rId2", "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties", "docProps/core.xml"),
                    ("rId3", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties", "docProps/app.xml"),
                ]
            ),
        )
        zf.writestr("docProps/app.xml", app_xml(len(slides)))
        zf.writestr("docProps/core.xml", core_xml())
        zf.writestr("ppt/presentation.xml", presentation_xml(len(slides)))

        pres_rels = [("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster", "slideMasters/slideMaster1.xml")]
        pres_rels.extend(
            (f"rId{i + 2}", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide", f"slides/slide{i + 1}.xml")
            for i in range(len(slides))
        )
        next_id = len(slides) + 2
        pres_rels.extend(
            [
                (f"rId{next_id + 1}", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/presProps", "presProps.xml"),
                (f"rId{next_id + 2}", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/viewProps", "viewProps.xml"),
                (f"rId{next_id + 3}", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/tableStyles", "tableStyles.xml"),
            ]
        )
        zf.writestr("ppt/_rels/presentation.xml.rels", rels_xml(pres_rels))

        zf.writestr("ppt/slideMasters/slideMaster1.xml", slide_master_xml())
        master_rels = [
            (f"rId{i + 1}", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout", f"../slideLayouts/slideLayout{i + 1}.xml")
            for i in range(len(LAYOUTS))
        ]
        master_rels.append(("rIdTheme", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme", "../theme/theme1.xml"))
        zf.writestr("ppt/slideMasters/_rels/slideMaster1.xml.rels", rels_xml(master_rels))

        for i, layout_name in enumerate(LAYOUTS, 1):
            zf.writestr(f"ppt/slideLayouts/slideLayout{i}.xml", slide_layout_xml(layout_name, i))
            zf.writestr(
                f"ppt/slideLayouts/_rels/slideLayout{i}.xml.rels",
                rels_xml(
                    [
                        ("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster", "../slideMasters/slideMaster1.xml"),
                    ]
                ),
            )
        for i, slide in enumerate(slides, 1):
            zf.writestr(f"ppt/slides/slide{i}.xml", slide_xml(slide))
            zf.writestr(
                f"ppt/slides/_rels/slide{i}.xml.rels",
                rels_xml(
                    [
                        ("rId1", "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout", f"../slideLayouts/slideLayout{slide.layout}.xml"),
                    ]
                ),
            )
        zf.writestr("ppt/theme/theme1.xml", theme_xml())
        for part, data in static_parts().items():
            zf.writestr(part, data)


def write_source_notes(slides: list[Slide]) -> None:
    NOTES_OUT.write_text(
        "\n".join(
            [
                "# CAREVO VC / Consulting PowerPoint Template - Source Notes",
                "",
                "Built only from local CAREVO design files and in-repo UI tokens.",
                "",
                "## Design sources used",
                "- `CAREVO_Brand_Design_Guide.pdf`: color system, Helvetica/Courier implementation, logo usage, 8px grid, component and motion principles.",
                "- `carevo-design-philosophy.md`: Klinische Stille, restrained palette, typography scale, asymmetry and horizontal rules.",
                "- `03_UI_UX_SPEC.md`: enterprise MedTech tone, workflow clarity, reviewability, app-shell/product states.",
                "- `src/app/globals.css` and `tailwind.config.ts`: exact CSS tokens, radius and shadow behavior.",
                "- `src/components/shared/logo.tsx`: local CAREVO mark behavior.",
                "",
                "## Exact color tokens",
                f"- Tiefschwarz: `#{BLACK}`",
                f"- Reinweiss: `#{WHITE}`",
                f"- Medizinblaugruen: `#{TEAL}`",
                f"- Surface: `#{SURFACE}`",
                f"- Border: `#{BORDER}`",
                f"- Muted: `#{MUTED}`",
                f"- Secondary: `#{SECONDARY}`",
                f"- Error: `#{ERROR}`",
                "",
                "## PowerPoint outputs",
                f"- `{PPTX_OUT}`: editable example deck with {len(slides)} slides.",
                f"- `{POTX_OUT}`: PowerPoint template package with the same master/layout library.",
                f"- Master layouts included: {len(LAYOUTS)}.",
                "",
                "## Notes",
                "- Example metrics are placeholders and are labeled or structured as illustrative.",
                "- The deck uses no external assets, images, or non-CAREVO color palette.",
            ]
        )
        + "\n",
        encoding="utf-8",
    )


def main() -> None:
    OUT_DIR.mkdir(exist_ok=True)
    slides = make_slides()
    write_package(PPTX_OUT, slides, template=False)
    write_package(POTX_OUT, slides, template=True)
    write_source_notes(slides)
    print(f"Wrote {PPTX_OUT} ({len(slides)} slides, {len(LAYOUTS)} layouts)")
    print(f"Wrote {POTX_OUT}")
    print(f"Wrote {NOTES_OUT}")


if __name__ == "__main__":
    main()

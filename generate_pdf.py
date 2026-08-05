import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

pdf_filename = "c:/Users/danho/Desktop/digits-naija-election-watch/DIGITs_Election_Watch_Invoice.pdf"
doc = SimpleDocTemplate(
    pdf_filename,
    pagesize=letter,
    rightMargin=36,
    leftMargin=36,
    topMargin=36,
    bottomMargin=36
)

styles = getSampleStyleSheet()

# Color Palette (Crest-derived: Deep Navy, Gold, Green)
NAVY = colors.HexColor("#0f172a")
DARK_NAVY = colors.HexColor("#090d16")
GOLD = colors.HexColor("#d4af37")
GREEN = colors.HexColor("#008751")
TEXT_DARK = colors.HexColor("#1e293b")
TEXT_MUTED = colors.HexColor("#64748b")
BG_LIGHT = colors.HexColor("#f8fafc")
LINE_COLOR = colors.HexColor("#e2e8f0")

title_style = ParagraphStyle(
    'DocTitle',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=22,
    leading=26,
    textColor=NAVY
)

subtitle_style = ParagraphStyle(
    'SubTitle',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9.5,
    leading=13.5,
    textColor=TEXT_MUTED
)

section_heading = ParagraphStyle(
    'SectionHeading',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=12,
    leading=16,
    textColor=NAVY,
    spaceBefore=10,
    spaceAfter=4
)

body_style = ParagraphStyle(
    'BodyDark',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=12.5,
    textColor=TEXT_DARK
)

body_bold = ParagraphStyle(
    'BodyBold',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8.5,
    leading=12.5,
    textColor=TEXT_DARK
)

table_header = ParagraphStyle(
    'TableHeader',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8.5,
    leading=11.5,
    textColor=colors.white
)

table_body = ParagraphStyle(
    'TableBody',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8,
    leading=11.5,
    textColor=TEXT_DARK
)

table_body_bold = ParagraphStyle(
    'TableBodyBold',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8,
    leading=11.5,
    textColor=TEXT_DARK
)

right_align_bold = ParagraphStyle(
    'RightBold',
    parent=table_body_bold,
    alignment=2
)

elements = []

# Header Table
header_data = [
    [
        Paragraph("<b>COMMERCIAL INVOICE</b>", title_style),
        Paragraph("<b>WYN-Tech Systems Ltd.</b><br/>SirHope of WYN-Tech<br/>Abuja, FCT, Nigeria<br/>wyntech.ng@gmail.com", ParagraphStyle('RightHeader', parent=subtitle_style, alignment=2))
    ]
]
header_table = Table(header_data, colWidths=[270, 270])
header_table.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('BOTTOMPADDING', (0,0), (-1,-1), 0),
]))
elements.append(header_table)
elements.append(Spacer(1, 8))
elements.append(HRFlowable(width="100%", thickness=1.5, color=GOLD, spaceAfter=10))

# Invoice Meta & Client Details
meta_data = [
    [
        Paragraph("<b>CLIENT DETAILS:</b><br/>DIGITs Nigeria Election Watch<br/>Federal Republic of Nigeria<br/>Attn: National Steering Committee", body_style),
        Paragraph("<b>INVOICE DETAILS:</b><br/>Invoice #: <b>INV-2026-DIGEO-058M</b><br/>Date: <b>August 5, 2026</b><br/>Due Date: <b>Upon Project Sign-off</b><br/>Total Value: <b>NGN ₦58,000,000.00</b>", body_style)
    ]
]
meta_table = Table(meta_data, colWidths=[270, 270])
meta_table.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
    ('PADDING', (0,0), (-1,-1), 8),
    ('BOX', (0,0), (-1,-1), 0.5, LINE_COLOR),
]))
elements.append(meta_table)
elements.append(Spacer(1, 10))

# Expanded Scope Specification
elements.append(Paragraph("EXPANDED TECHNICAL SCOPE & SYSTEM ARCHITECTURE SPECIFICATION", section_heading))
elements.append(Paragraph(
    "Full-scale engineering, deployment, high-concurrency optimization, and rigorous load testing for the <b>DIGITs Nigeria Election Watch Platform</b>. "
    "The system delivers real-time election monitoring across Nigeria's <b>176,846 polling units</b> across all 36 States and the FCT. "
    "Architected with redundant auto-scaling cloud infrastructure, WebRTC live video streaming clusters, mobile applications (Android & iOS), "
    "and a resilient data pipeline verified via k6/Locust distributed load testing to guarantee seamless stability under peak loads of up to <b>10,000,000 concurrent active citizen users</b> without degradation or crash.",
    body_style
))
elements.append(Spacer(1, 10))

# Detailed Line Items Table
line_items = [
    [
        Paragraph("Module / Component", table_header),
        Paragraph("Expanded Technical Deliverables & Specifications", table_header),
        Paragraph("Amount (NGN ₦)", ParagraphStyle('RightTH', parent=table_header, alignment=2))
    ],
    [
        Paragraph("1. Web Application & 11-Screen Control Center", table_body_bold),
        Paragraph("• React 19, Vite, TanStack Router with SPA hydration fix<br/>"
                  "• Custom OKLCH design system (deep navy, Nigerian green, ceremonial gold)<br/>"
                  "• 1-to-6 split-screen low-latency WebRTC live observer grid with click-to-maximize<br/>"
                  "• 11-screen Command Center (Live Ops, Evidence Queue, Incident Triage, Observers, Audit Log, Training, Users, Settings)", table_body),
        Paragraph("₦ 12,500,000", right_align_bold)
    ],
    [
        Paragraph("2. Cross-Platform Mobile Apps (Android & iOS)", table_body_bold),
        Paragraph("• Native iOS & Android applications (React Native / Expo / Capacitor engine)<br/>"
                  "• Forced GPS Geolocation gate & reverse geocoding check before camera release<br/>"
                  "• On-the-spot 2-minute live camera recording with real-time SHA-256 hash sealing<br/>"
                  "• Direct gallery upload blocking to eliminate pre-recorded / spoofed video<br/>"
                  "• Cryptographic NIN (National Identity Number) identity verification hash", table_body),
        Paragraph("₦ 15,000,000", right_align_bold)
    ],
    [
        Paragraph("3. 10M Concurrent User High-Availability Backend", table_body_bold),
        Paragraph("• Supabase Enterprise Cluster & PostgreSQL database auto-sharding with Read Replicas<br/>"
                  "• LiveKit WebRTC Intake Server cluster with adaptive-stream & dynacast layer selection<br/>"
                  "• Redis Memory Caching layer & Supabase Edge Functions for zero-cold-start proxying<br/>"
                  "• Auto-scaling Kubernetes/Cloud edge deployment built for 10,000,000 peak concurrent users", table_body),
        Paragraph("₦ 17,500,000", right_align_bold)
    ],
    [
        Paragraph("4. DIGEO Accreditation Academy & Verification", table_body_bold),
        Paragraph("• 6 self-paced interactive modules based on Electoral Act 2022 & BVAS protocols<br/>"
                  "• 24 EC8A arithmetic & incident triage assessment items with 70% passing threshold<br/>"
                  "• Automated digital certificate generation with cryptographic verification QR code<br/>"
                  "• Database Row-Level Security (RLS) role enforcement (Super Admin, Operator, Observer, Citizen)", table_body),
        Paragraph("₦ 5,500,000", right_align_bold)
    ],
    [
        Paragraph("5. Stress Testing, QA, Penetration Audit & SLA", table_body_bold),
        Paragraph("• k6 / Locust distributed load testing simulating 10,000,000 concurrent active citizen viewers<br/>"
                  "• Multi-region DDoS mitigation, failover redundancy, and automated backup vault<br/>"
                  "• End-to-end cryptographic audit, security penetration testing & 24h media auto-purge vault<br/>"
                  "• 12-month SLA maintenance & Election Day War Room live technical standby", table_body),
        Paragraph("₦ 7,500,000", right_align_bold)
    ]
]

item_table = Table(line_items, colWidths=[130, 270, 140])
item_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), NAVY),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('PADDING', (0,0), (-1,-1), 6),
    ('GRID', (0,0), (-1,-1), 0.5, LINE_COLOR),
    ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
]))
elements.append(item_table)
elements.append(Spacer(1, 8))

# Totals Table
totals_data = [
    [Paragraph("Subtotal:", table_body_bold), Paragraph("₦ 58,000,000.00", right_align_bold)],
    [Paragraph("Taxes / Statutory Duties (Inclusive):", table_body), Paragraph("₦ 0.00", ParagraphStyle('RightVal', parent=table_body, alignment=2))],
    [Paragraph("<b>TOTAL REVISED VALUE:</b>", ParagraphStyle('GT', parent=section_heading, fontSize=11, leading=13, spaceBefore=0, spaceAfter=0)), 
     Paragraph("<b>₦ 58,000,000.00</b>", ParagraphStyle('GTR', parent=section_heading, fontSize=13, leading=15, textColor=GREEN, alignment=2))]
]
totals_table = Table(totals_data, colWidths=[380, 160])
totals_table.setStyle(TableStyle([
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('PADDING', (0,0), (-1,-1), 5),
    ('BACKGROUND', (0,2), (-1,2), colors.HexColor("#f1f5f9")),
    ('BOX', (0,2), (-1,2), 1, GOLD),
]))
elements.append(totals_table)
elements.append(Spacer(1, 10))

# Expanded Payment Terms & SLA Structure
terms_text = (
    "<b>PAYMENT MILESTONES & SLA TERMS:</b><br/>"
    "• <b>Mobilization Deposit (40% - ₦ 23,200,000)</b>: Core Web/Mobile platform setup & 10M infrastructure provision.<br/>"
    "• <b>Beta Sign-off (40% - ₦ 23,200,000)</b>: Completion of 10M concurrent user load test, security audit & app store submission.<br/>"
    "• <b>Final Acceptance (20% - ₦ 11,600,000)</b>: Production handover & live Election Day Control Center war-room deployment.<br/>"
    "• <b>Banking Info</b>: Zenith Bank / Access Bank | Account Name: <b>WYN-Tech Systems Ltd</b> | Account #: <b>1012345678</b><br/>"
    "• <b>Maintenance Warranty</b>: 12-month SLA support, emergency patch response within 15 minutes, 99.99% uptime guarantee."
)
elements.append(Paragraph(terms_text, body_style))
elements.append(Spacer(1, 10))

# Footer
elements.append(HRFlowable(width="100%", thickness=1, color=LINE_COLOR, spaceAfter=6))
elements.append(Paragraph("Built by <b>SirHope</b> of <b>WYN-Tech</b> — DIGITs Nigeria Election Watch Platform Engine", ParagraphStyle('Foot', parent=subtitle_style, alignment=1)))

doc.build(elements)
print("PDF generated successfully:", pdf_filename)

import os
from PIL import Image, ImageDraw, ImageFont

# Screen dimensions (Android Phone portrait 420 x 890)
W, H = 420, 890

# Color Palette
PRIMARY = (79, 70, 229)       # #4F46E5 Indigo
PRIMARY_LIGHT = (238, 242, 255) # #EEF2FF
PRIMARY_DARK = (67, 56, 202)
BG = (248, 250, 252)          # #F8FAFC Slate 50
CARD_BG = (255, 255, 255)
BORDER = (226, 232, 240)       # #E2E8F0
TEXT_MAIN = (15, 23, 42)       # #0F172A
TEXT_MUTED = (100, 116, 139)   # #64748B
GREEN = (16, 185, 129)        # #10B981
GREEN_LIGHT = (209, 250, 229)
GREEN_DARK = (4, 120, 87)
RED = (239, 68, 68)           # #EF4444
RED_LIGHT = (254, 226, 226)
RED_DARK = (185, 28, 28)
AMBER = (245, 158, 11)        # #F59E0B
AMBER_LIGHT = (254, 243, 199)
AMBER_DARK = (180, 83, 9)
SURFACE = (241, 245, 249)

def get_font(size, bold=False):
    # Try system fonts on Windows
    fonts = [
        "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\calibrib.ttf" if bold else "C:\\Windows\\Fonts\\calibri.ttf",
    ]
    for f in fonts:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except:
                pass
    return ImageFont.load_default()

def draw_status_bar(draw):
    # Top Status Bar (height 36px)
    draw.rectangle([0, 0, W, 36], fill=CARD_BG)
    font_sb = get_font(13, bold=True)
    draw.text((22, 10), "10:30", fill=TEXT_MAIN, font=font_sb)
    
    # Wi-Fi / Battery / 5G icons on right
    font_sub = get_font(11, bold=True)
    draw.text((W - 105, 11), "5G", fill=TEXT_MUTED, font=font_sub)
    draw.text((W - 80, 10), "●●●", fill=TEXT_MUTED, font=font_sub)
    
    # Battery icon
    draw.rectangle([W - 48, 13, W - 24, 25], outline=TEXT_MUTED, width=1)
    draw.rectangle([W - 46, 15, W - 30, 23], fill=GREEN)
    draw.rectangle([W - 24, 16, W - 22, 22], fill=TEXT_MUTED)

def draw_bottom_nav(draw, active_tab="Dashboard"):
    # Bottom Navigation Bar (height 68px)
    nav_y = H - 68
    draw.rectangle([0, nav_y, W, H], fill=CARD_BG)
    draw.line([0, nav_y, W, nav_y], fill=BORDER, width=1)
    
    tabs = [
        ("Dashboard", "●", 52),
        ("Mark Attendance", "✓", 155),
        ("Students", "👥", 262),
        ("Reports", "📊", 365),
    ]
    
    font_lbl = get_font(10, bold=True)
    font_icon = get_font(14, bold=True)
    
    for name, icon, center_x in tabs:
        is_active = (name == active_tab)
        color = PRIMARY if is_active else TEXT_MUTED
        
        # Icon
        draw.text((center_x - 7, nav_y + 8), icon, fill=color, font=font_icon)
        
        # Label
        bbox = font_lbl.getbbox(name)
        text_w = bbox[2] - bbox[0]
        draw.text((center_x - text_w // 2, nav_y + 28), name, fill=color, font=font_lbl)
        
    # Android bottom gesture pill
    draw.rounded_rectangle([W // 2 - 40, H - 10, W // 2 + 40, H - 6], radius=2, fill=(148, 163, 184))

# -------------------------------------------------------------
# 1. SCREEN 1: DASHBOARD
# -------------------------------------------------------------
def make_screenshot_dashboard():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    draw_status_bar(draw)
    
    # Header
    draw.rectangle([0, 36, W, 96], fill=CARD_BG)
    draw.line([0, 96, W, 96], fill=BORDER, width=1)
    draw.text((18, 44), "ATTENDANCE MANAGEMENT", fill=PRIMARY, font=get_font(11, bold=True))
    draw.text((18, 62), "Dashboard & Analytics", fill=TEXT_MAIN, font=get_font(20, bold=True))
    
    # Demo Data Pill Button
    draw.rounded_rectangle([W - 105, 52, W - 18, 80], radius=14, fill=PRIMARY_LIGHT)
    draw.text((W - 95, 59), "Demo Data", fill=PRIMARY, font=get_font(11, bold=True))
    
    # Batch Chips
    chips = ["All", "MCA 1st Year", "MCA 2nd Year"]
    cx = 18
    for i, c in enumerate(chips):
        is_act = (i == 0)
        bg = PRIMARY if is_act else CARD_BG
        fg = (255, 255, 255) if is_act else TEXT_MUTED
        draw.rounded_rectangle([cx, 108, cx + 110, 138], radius=15, fill=bg, outline=PRIMARY if is_act else BORDER, width=1)
        draw.text((cx + 15, 116), c, fill=fg, font=get_font(11, bold=True))
        cx += 118
        
    # DEFAULTER WARNING ALERT BANNER
    draw.rounded_rectangle([18, 148, W - 18, 218], radius=12, fill=RED_LIGHT, outline=RED, width=1)
    draw.rectangle([28, 158, 60, 190], fill=(254, 202, 202))
    draw.text((38, 166), "!", fill=RED_DARK, font=get_font(16, bold=True))
    draw.text((70, 158), "1 Student Below 75% Threshold", fill=RED_DARK, font=get_font(13, bold=True))
    draw.text((70, 178), "Attendance shortage in MCA 1st Year.", fill=TEXT_MUTED, font=get_font(10))
    draw.text((70, 194), "Tap to view Defaulters Report >", fill=RED_DARK, font=get_font(10, bold=True))
    
    # 2x2 Stats Grid
    # Card 1: Students
    draw.rounded_rectangle([18, 230, 200, 315], radius=12, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((28, 240), "STUDENTS", fill=TEXT_MUTED, font=get_font(10, bold=True))
    draw.text((28, 258), "10", fill=PRIMARY, font=get_font(28, bold=True))
    draw.text((28, 294), "All Batches enrolled", fill=TEXT_MUTED, font=get_font(9.5))
    
    # Card 2: Sessions
    draw.rounded_rectangle([210, 230, W - 18, 315], radius=12, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((220, 240), "SESSIONS", fill=TEXT_MUTED, font=get_font(10, bold=True))
    draw.text((220, 258), "8", fill=(6, 182, 212), font=get_font(28, bold=True))
    draw.text((220, 294), "Lectures marked", fill=TEXT_MUTED, font=get_font(9.5))
    
    # Card 3: Overall Avg
    draw.rounded_rectangle([18, 325, 200, 410], radius=12, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((28, 335), "OVERALL AVG", fill=TEXT_MUTED, font=get_font(10, bold=True))
    draw.text((28, 353), "79.2%", fill=GREEN, font=get_font(28, bold=True))
    draw.text((28, 389), "Healthy Average", fill=GREEN_DARK, font=get_font(9.5, bold=True))
    
    # Card 4: Defaulters
    draw.rounded_rectangle([210, 325, W - 18, 410], radius=12, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((220, 335), "DEFAULTERS", fill=RED_DARK, font=get_font(10, bold=True))
    draw.text((220, 353), "1", fill=RED, font=get_font(28, bold=True))
    draw.text((220, 389), "Below 75% limit (Tap)", fill=RED_DARK, font=get_font(9.5, bold=True))
    
    # Quick Actions
    draw.text((18, 428), "Quick Actions", fill=TEXT_MAIN, font=get_font(14, bold=True))
    
    # Action Card 1: Mark Attendance
    draw.rounded_rectangle([18, 448, 200, 525], radius=12, fill=PRIMARY)
    draw.text((28, 460), "📋 Mark Attendance", fill=(255, 255, 255), font=get_font(12, bold=True))
    draw.text((28, 485), "Take today's class roll call in seconds", fill=(224, 231, 255), font=get_font(9.5))
    
    # Action Card 2: Register Student
    draw.rounded_rectangle([210, 448, W - 18, 525], radius=12, fill=(14, 165, 233))
    draw.text((220, 460), "👤 Add Student", fill=(255, 255, 255), font=get_font(12, bold=True))
    draw.text((220, 485), "Enroll new student to attendance register", fill=(224, 242, 254), font=get_font(9.5))
    
    # Recent Sessions
    draw.text((18, 545), "Recent Class Sessions", fill=TEXT_MAIN, font=get_font(14, bold=True))
    
    # Session 1
    draw.rounded_rectangle([18, 568, W - 18, 665], radius=12, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((28, 578), "📅 2026-10-21  •  MCA 1st Year", fill=TEXT_MAIN, font=get_font(12, bold=True))
    draw.text((W - 85, 578), "83.3%", fill=GREEN, font=get_font(12, bold=True))
    draw.rounded_rectangle([28, 602, W - 28, 608], radius=3, fill=BORDER)
    draw.rounded_rectangle([28, 602, 28 + int((W - 56) * 0.833), 608], radius=3, fill=GREEN)
    draw.text((28, 618), "Present: 5", fill=GREEN_DARK, font=get_font(10, bold=True))
    draw.text((120, 618), "Absent: 1", fill=RED_DARK, font=get_font(10, bold=True))
    draw.text((200, 618), "Late: 0", fill=AMBER_DARK, font=get_font(10, bold=True))
    draw.text((28, 638), "Core Computer Science • Lecture 8", fill=TEXT_MUTED, font=get_font(9.5))

    # Session 2
    draw.rounded_rectangle([18, 678, W - 18, 775], radius=12, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((28, 688), "📅 2026-10-20  •  MCA 1st Year", fill=TEXT_MAIN, font=get_font(12, bold=True))
    draw.text((W - 85, 688), "100%", fill=GREEN, font=get_font(12, bold=True))
    draw.rounded_rectangle([28, 712, W - 28, 718], radius=3, fill=GREEN)
    draw.text((28, 728), "Present: 6", fill=GREEN_DARK, font=get_font(10, bold=True))
    draw.text((120, 728), "Absent: 0", fill=TEXT_MUTED, font=get_font(10))
    draw.text((200, 728), "Late: 0", fill=TEXT_MUTED, font=get_font(10))
    draw.text((28, 748), "Data Structures & Algorithms • Lecture 7", fill=TEXT_MUTED, font=get_font(9.5))

    draw_bottom_nav(draw, active_tab="Dashboard")
    return img

# -------------------------------------------------------------
# 2. SCREEN 2: STUDENT DIRECTORY
# -------------------------------------------------------------
def make_screenshot_students():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    draw_status_bar(draw)
    
    # Header
    draw.rectangle([0, 36, W, 96], fill=CARD_BG)
    draw.line([0, 96, W, 96], fill=BORDER, width=1)
    draw.text((18, 44), "STUDENT DIRECTORY", fill=PRIMARY, font=get_font(11, bold=True))
    draw.text((18, 62), "Registered Students", fill=TEXT_MAIN, font=get_font(20, bold=True))
    
    # + Add Button
    draw.rounded_rectangle([W - 90, 52, W - 18, 80], radius=14, fill=PRIMARY)
    draw.text((W - 78, 59), "+ Add", fill=(255, 255, 255), font=get_font(12, bold=True))
    
    # Search Bar
    draw.rounded_rectangle([18, 106, W - 18, 146], radius=10, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((32, 118), "🔍  Search by student name or roll no...", fill=TEXT_MUTED, font=get_font(11))
    
    # Batch Pills
    chips = ["All", "MCA 1st Year", "MCA 2nd Year"]
    cx = 18
    for i, c in enumerate(chips):
        is_act = (i == 1) # MCA 1st Year selected
        bg = PRIMARY if is_act else CARD_BG
        fg = (255, 255, 255) if is_act else TEXT_MUTED
        draw.rounded_rectangle([cx, 156, cx + 110, 186], radius=15, fill=bg, outline=PRIMARY if is_act else BORDER, width=1)
        draw.text((cx + 14, 164), c, fill=fg, font=get_font(11, bold=True))
        cx += 118
        
    students = [
        ("Aarav Sharma", "MCA-01", "MCA 1st Year", 81.3, "6/8 classes", GREEN, GREEN_LIGHT),
        ("Ananya Iyer", "MCA-02", "MCA 1st Year", 100.0, "8/8 classes", GREEN, GREEN_LIGHT),
        ("Rohan Deshmukh", "MCA-03", "MCA 1st Year", 43.8, "3/8 classes", RED, RED_LIGHT),
        ("Diya Patel", "MCA-04", "MCA 1st Year", 100.0, "8/8 classes", GREEN, GREEN_LIGHT),
        ("Vikramaditya Roy", "MCA-05", "MCA 1st Year", 93.8, "7/8 classes", GREEN, GREEN_LIGHT),
        ("Sneha Kulkarni", "MCA-06", "MCA 1st Year", 87.5, "7/8 classes", GREEN, GREEN_LIGHT),
    ]
    
    cy = 198
    for name, roll, batch, pct, att, color, light in students:
        draw.rounded_rectangle([18, cy, W - 18, cy + 90], radius=12, fill=CARD_BG, outline=BORDER, width=1)
        
        # Avatar circle
        draw.ellipse([28, cy + 12, 64, cy + 48], fill=PRIMARY_LIGHT)
        initials = "".join([n[0] for n in name.split()[:2]])
        draw.text((36, cy + 20), initials, fill=PRIMARY, font=get_font(13, bold=True))
        
        # Details
        draw.text((72, cy + 12), name, fill=TEXT_MAIN, font=get_font(13, bold=True))
        draw.text((72, cy + 30), f"Roll: {roll}  •  {batch}", fill=TEXT_MUTED, font=get_font(10))
        
        # Percentage Badge
        draw.rounded_rectangle([W - 75, cy + 14, W - 28, cy + 36], radius=6, fill=light)
        draw.text((W - 70, cy + 18), f"{pct}%", fill=color, font=get_font(11, bold=True))
        
        # Progress Bar
        bar_w = W - 56
        draw.rounded_rectangle([28, cy + 54, W - 28, cy + 60], radius=3, fill=BORDER)
        draw.rounded_rectangle([28, cy + 54, 28 + int(bar_w * (pct / 100)), cy + 60], radius=3, fill=color)
        
        # Subtext
        draw.text((28, cy + 68), f"Attended: {att}", fill=TEXT_MUTED, font=get_font(9.5))
        draw.text((W - 78, cy + 68), "✏️ Edit   🗑️", fill=PRIMARY, font=get_font(9.5))
        
        cy += 100
        if cy > H - 80: break

    draw_bottom_nav(draw, active_tab="Students")
    return img

# -------------------------------------------------------------
# 3. SCREEN 3: ADD STUDENT (REGISTRATION)
# -------------------------------------------------------------
def make_screenshot_add_student():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    draw_status_bar(draw)
    
    # Header with Back
    draw.rectangle([0, 36, W, 86], fill=CARD_BG)
    draw.line([0, 86, W, 86], fill=BORDER, width=1)
    draw.text((18, 50), "←", fill=TEXT_MAIN, font=get_font(18, bold=True))
    draw.text((50, 50), "Student Registration", fill=TEXT_MAIN, font=get_font(17, bold=True))
    
    # Info Banner
    draw.rounded_rectangle([18, 98, W - 18, 160], radius=12, fill=CARD_BG, outline=BORDER, width=1)
    draw.ellipse([28, 110, 64, 146], fill=PRIMARY_LIGHT)
    draw.text((38, 118), "👤", fill=PRIMARY, font=get_font(18))
    draw.text((74, 112), "Enroll New Student", fill=TEXT_MAIN, font=get_font(13, bold=True))
    draw.text((74, 130), "Enter academic details to record in register.", fill=TEXT_MUTED, font=get_font(10))
    
    fields = [
        ("Full Name *", "John Doe", "Aarav Sharma"),
        ("Roll No / Student ID *", "e.g. MCA-01", "MCA-01"),
        ("Email Address", "student@college.edu", "aarav.sharma@college.edu"),
        ("Contact Phone Number", "+91 98765 43210", "+91 98765 43210"),
    ]
    
    fy = 175
    # Field 1: Name
    draw.text((18, fy), "Full Name *", fill=TEXT_MAIN, font=get_font(11, bold=True))
    draw.rounded_rectangle([18, fy + 20, W - 18, fy + 60], radius=8, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((28, fy + 32), "Aarav Sharma", fill=TEXT_MAIN, font=get_font(12))
    
    # Field 2: Roll No
    fy += 75
    draw.text((18, fy), "Roll No / Student ID *", fill=TEXT_MAIN, font=get_font(11, bold=True))
    draw.rounded_rectangle([18, fy + 20, W - 18, fy + 60], radius=8, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((28, fy + 32), "MCA-01", fill=TEXT_MAIN, font=get_font(12, bold=True))
    
    # Field 3: Batch Selector
    fy += 75
    draw.text((18, fy), "Class / Batch *", fill=TEXT_MAIN, font=get_font(11, bold=True))
    batches = ["MCA 1st Year", "MCA 2nd Year", "BCA 3rd Year"]
    bx = 18
    for i, b in enumerate(batches):
        is_sel = (i == 0)
        bg = PRIMARY if is_sel else CARD_BG
        fg = (255, 255, 255) if is_sel else TEXT_MUTED
        draw.rounded_rectangle([bx, fy + 20, bx + 115, fy + 55], radius=8, fill=bg, outline=PRIMARY if is_sel else BORDER, width=1)
        draw.text((bx + 14, fy + 28), b, fill=fg, font=get_font(10.5, bold=True))
        bx += 122
        
    # Field 4: Gender Selector
    fy += 72
    draw.text((18, fy), "Gender", fill=TEXT_MAIN, font=get_font(11, bold=True))
    genders = ["♂ Male", "♀ Female", "Other"]
    gx = 18
    for i, g in enumerate(genders):
        is_sel = (i == 0)
        bg = PRIMARY if is_sel else CARD_BG
        fg = (255, 255, 255) if is_sel else TEXT_MUTED
        draw.rounded_rectangle([gx, fy + 20, gx + 115, fy + 55], radius=8, fill=bg, outline=PRIMARY if is_sel else BORDER, width=1)
        draw.text((gx + 26, fy + 28), g, fill=fg, font=get_font(11, bold=True))
        gx += 122
        
    # Field 5: Email
    fy += 72
    draw.text((18, fy), "Email Address", fill=TEXT_MAIN, font=get_font(11, bold=True))
    draw.rounded_rectangle([18, fy + 20, W - 18, fy + 60], radius=8, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((28, fy + 32), "aarav.sharma@college.edu", fill=TEXT_MAIN, font=get_font(12))
    
    # Field 6: Phone
    fy += 75
    draw.text((18, fy), "Contact Phone Number", fill=TEXT_MAIN, font=get_font(11, bold=True))
    draw.rounded_rectangle([18, fy + 20, W - 18, fy + 60], radius=8, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((28, fy + 32), "+91 98765 43210", fill=TEXT_MAIN, font=get_font(12))
    
    # Submit Button
    fy += 85
    draw.rounded_rectangle([18, fy, W - 18, fy + 50], radius=12, fill=PRIMARY)
    draw.text((W // 2 - 62, fy + 16), "✓  Register Student", fill=(255, 255, 255), font=get_font(13, bold=True))
    
    return img

# -------------------------------------------------------------
# 4. SCREEN 4: DAILY ATTENDANCE (MARKING)
# -------------------------------------------------------------
def make_screenshot_mark_attendance():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    draw_status_bar(draw)
    
    # Header
    draw.rectangle([0, 36, W, 96], fill=CARD_BG)
    draw.line([0, 96, W, 96], fill=BORDER, width=1)
    draw.text((18, 44), "CLASS ROLL CALL", fill=PRIMARY, font=get_font(11, bold=True))
    draw.text((18, 62), "Mark Attendance", fill=TEXT_MAIN, font=get_font(20, bold=True))
    
    # Saved badge
    draw.rounded_rectangle([W - 85, 52, W - 18, 80], radius=14, fill=GREEN_LIGHT)
    draw.text((W - 75, 59), "✓ Saved", fill=GREEN_DARK, font=get_font(11, bold=True))
    
    # Controls Card: Date + Batch
    draw.rounded_rectangle([18, 106, W - 18, 206], radius=12, fill=CARD_BG, outline=BORDER, width=1)
    
    # Date row
    draw.rounded_rectangle([28, 116, 68, 146], radius=8, fill=PRIMARY_LIGHT)
    draw.text((42, 122), "◀", fill=PRIMARY, font=get_font(12))
    
    draw.rounded_rectangle([76, 116, 260, 146], radius=8, fill=SURFACE)
    draw.text((88, 124), "📅  2026-10-21", fill=TEXT_MAIN, font=get_font(12, bold=True))
    
    draw.rounded_rectangle([268, 116, 308, 146], radius=8, fill=PRIMARY_LIGHT)
    draw.text((282, 122), "▶", fill=PRIMARY, font=get_font(12))
    
    draw.rounded_rectangle([316, 116, W - 28, 146], radius=8, fill=PRIMARY_LIGHT)
    draw.text((328, 124), "Today", fill=PRIMARY, font=get_font(11, bold=True))
    
    # Batch Pills
    chips = ["MCA 1st Year", "MCA 2nd Year"]
    cx = 28
    for i, c in enumerate(chips):
        is_act = (i == 0)
        bg = PRIMARY if is_act else SURFACE
        fg = (255, 255, 255) if is_act else TEXT_MUTED
        draw.rounded_rectangle([cx, 156, cx + 115, 186], radius=8, fill=bg)
        draw.text((cx + 14, 164), c, fill=fg, font=get_font(11, bold=True))
        cx += 124
        
    # Subject row
    draw.text((cx + 8, 164), "📖 Core CS", fill=TEXT_MUTED, font=get_font(11))
    
    # Summary Bar
    draw.rounded_rectangle([18, 216, W - 18, 262], radius=10, fill=CARD_BG, outline=BORDER, width=1)
    stats_row = [("Total", "6", TEXT_MAIN), ("Present", "5", GREEN_DARK), ("Absent", "1", RED_DARK), ("Late", "0", AMBER_DARK), ("Rate", "83%", PRIMARY)]
    sx = 28
    for lbl, val, col in stats_row:
        draw.text((sx + 6, 222), val, fill=col, font=get_font(13, bold=True))
        draw.text((sx, 240), lbl, fill=TEXT_MUTED, font=get_font(10))
        sx += 72
        
    # Bulk Action Buttons
    draw.rounded_rectangle([18, 272, 140, 306], radius=8, fill=GREEN_LIGHT)
    draw.text((32, 282), "✓ All Present", fill=GREEN_DARK, font=get_font(11, bold=True))
    
    draw.rounded_rectangle([148, 272, 270, 306], radius=8, fill=RED_LIGHT)
    draw.text((165, 282), "✗ All Absent", fill=RED_DARK, font=get_font(11, bold=True))
    
    draw.rounded_rectangle([278, 272, W - 18, 306], radius=8, fill=SURFACE)
    draw.text((310, 282), "Clear", fill=TEXT_MUTED, font=get_font(11, bold=True))
    
    # Students List
    students_mark = [
        ("Aarav Sharma", "MCA-01", "P"),
        ("Ananya Iyer", "MCA-02", "P"),
        ("Rohan Deshmukh", "MCA-03", "A"),
        ("Diya Patel", "MCA-04", "P"),
        ("Vikramaditya Roy", "MCA-05", "P"),
        ("Sneha Kulkarni", "MCA-06", "P"),
    ]
    
    my = 318
    for name, roll, status in students_mark:
        draw.rounded_rectangle([18, my, W - 18, my + 62], radius=10, fill=CARD_BG, outline=BORDER, width=1)
        
        # Details
        draw.text((28, my + 14), name, fill=TEXT_MAIN, font=get_font(13, bold=True))
        draw.text((28, my + 34), f"Roll: {roll}", fill=TEXT_MUTED, font=get_font(11))
        
        # P / A / L Buttons
        # P button
        is_p = (status == "P")
        draw.rounded_rectangle([W - 138, my + 12, W - 100, my + 50], radius=8, fill=GREEN if is_p else SURFACE, outline=GREEN_DARK if is_p else BORDER)
        draw.text((W - 124, my + 20), "P", fill=(255, 255, 255) if is_p else GREEN_DARK, font=get_font(14, bold=True))
        
        # A button
        is_a = (status == "A")
        draw.rounded_rectangle([W - 94, my + 12, W - 56, my + 50], radius=8, fill=RED if is_a else SURFACE, outline=RED_DARK if is_a else BORDER)
        draw.text((W - 80, my + 20), "A", fill=(255, 255, 255) if is_a else RED_DARK, font=get_font(14, bold=True))
        
        # L button
        is_l = (status == "L")
        draw.rounded_rectangle([W - 50, my + 12, W - 12, my + 50], radius=8, fill=AMBER if is_l else SURFACE, outline=AMBER_DARK if is_l else BORDER)
        draw.text((W - 36, my + 20), "L", fill=(255, 255, 255) if is_l else AMBER_DARK, font=get_font(14, bold=True))
        
        my += 70

    # Floating Save Attendance Button
    draw.rounded_rectangle([18, H - 125, W - 18, H - 75], radius=12, fill=PRIMARY)
    draw.text((W // 2 - 65, H - 108), "💾  Save Attendance", fill=(255, 255, 255), font=get_font(13, bold=True))

    draw_bottom_nav(draw, active_tab="Mark Attendance")
    return img

# -------------------------------------------------------------
# 5. SCREEN 5: DEFAULTERS REPORT & RECOVERY
# -------------------------------------------------------------
def make_screenshot_defaulters():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    draw_status_bar(draw)
    
    # Header
    draw.rectangle([0, 36, W, 96], fill=CARD_BG)
    draw.line([0, 96, W, 96], fill=BORDER, width=1)
    draw.text((18, 44), "ANALYTICS & COMPLIANCE", fill=PRIMARY, font=get_font(11, bold=True))
    draw.text((18, 62), "Attendance Reports", fill=TEXT_MAIN, font=get_font(20, bold=True))
    
    # Share Button
    draw.rounded_rectangle([W - 85, 52, W - 18, 80], radius=14, fill=PRIMARY_LIGHT)
    draw.text((W - 74, 59), "↗ Share", fill=PRIMARY, font=get_font(11, bold=True))
    
    # Batch Pills
    chips = ["All", "MCA 1st Year", "MCA 2nd Year"]
    cx = 18
    for i, c in enumerate(chips):
        is_act = (i == 0)
        bg = PRIMARY if is_act else CARD_BG
        fg = (255, 255, 255) if is_act else TEXT_MUTED
        draw.rounded_rectangle([cx, 106, cx + 110, 136], radius=15, fill=bg, outline=PRIMARY if is_act else BORDER, width=1)
        draw.text((cx + 15, 114), c, fill=fg, font=get_font(11, bold=True))
        cx += 118
        
    # Main Tabs: Date-Wise / Rankings / Defaulters
    draw.rectangle([0, 146, W, 186], fill=CARD_BG)
    draw.line([0, 186, W, 186], fill=BORDER, width=1)
    
    draw.text((28, 158), "📅 Date-Wise", fill=TEXT_MUTED, font=get_font(11))
    draw.text((160, 158), "📊 Rankings", fill=TEXT_MUTED, font=get_font(11))
    
    # Defaulters Tab Active
    draw.rounded_rectangle([270, 150, W - 18, 182], radius=8, fill=RED_LIGHT)
    draw.text((280, 158), "⚠️ Defaulters (1)", fill=RED_DARK, font=get_font(11, bold=True))
    
    # Academic Policy Banner
    draw.rounded_rectangle([18, 198, W - 18, 275], radius=12, fill=RED_LIGHT, outline=RED, width=1)
    draw.text((28, 208), "Academic Regulation: Minimum 75% attendance", fill=RED_DARK, font=get_font(11, bold=True))
    draw.text((28, 226), "Students falling below 75% are ineligible for semester exams.", fill=TEXT_MUTED, font=get_font(9.5))
    
    # Status count pills
    draw.rounded_rectangle([28, 246, 170, 268], radius=6, fill=(254, 202, 202))
    draw.text((36, 251), "Critical (<65%): 1", fill=RED_DARK, font=get_font(9.5, bold=True))
    
    draw.rounded_rectangle([180, 246, 310, 268], radius=6, fill=AMBER_LIGHT)
    draw.text((188, 251), "At Risk (65-74%): 0", fill=AMBER_DARK, font=get_font(9.5, bold=True))
    
    # Defaulter Card: Rohan Deshmukh
    draw.rounded_rectangle([18, 290, W - 18, 480], radius=14, fill=CARD_BG, outline=RED, width=2)
    
    # Header
    draw.text((28, 302), "Rohan Deshmukh", fill=TEXT_MAIN, font=get_font(15, bold=True))
    
    # CRITICAL tag
    draw.rounded_rectangle([160, 302, 235, 322], radius=4, fill=RED_LIGHT)
    draw.text((168, 306), "CRITICAL", fill=RED_DARK, font=get_font(9, bold=True))
    
    draw.text((28, 324), "Roll: MCA-03  •  MCA 1st Year", fill=TEXT_MUTED, font=get_font(11))
    
    # Shortage Badge
    draw.rounded_rectangle([W - 85, 302, W - 28, 332], radius=8, fill=RED_LIGHT)
    draw.text((W - 80, 310), "43.8%", fill=RED, font=get_font(14, bold=True))
    
    # Progress Bar
    draw.rounded_rectangle([28, 348, W - 28, 356], radius=4, fill=BORDER)
    draw.rounded_rectangle([28, 348, 28 + int((W - 56) * 0.438), 356], radius=4, fill=RED)
    
    # Attendance breakdown
    draw.text((28, 366), "Attended: 3 of 8 lectures", fill=TEXT_MAIN, font=get_font(11, bold=True))
    draw.text((W - 130, 366), "Missed: 5 lectures", fill=RED_DARK, font=get_font(11, bold=True))
    
    # RECOVERY FORMULA CHIP
    draw.rounded_rectangle([28, 396, W - 28, 465], radius=10, fill=AMBER_LIGHT, outline=AMBER, width=1)
    draw.text((36, 404), "✨ Exam Defaulter Recovery Action:", fill=AMBER_DARK, font=get_font(11, bold=True))
    draw.text((36, 424), "Must attend next 10 consecutive classes to reach 75%.", fill=RED_DARK, font=get_font(10.5, bold=True))
    draw.text((36, 444), "Projected attendance after recovery: 75.0%", fill=TEXT_MUTED, font=get_font(9.5))
    
    # Batch Comparison Info
    draw.rounded_rectangle([18, 495, W - 18, 575], radius=12, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((28, 508), "Batch Attendance Distribution", fill=TEXT_MAIN, font=get_font(13, bold=True))
    draw.text((28, 528), "• Safe Zone (≥75%): 9 Students (90%)", fill=GREEN_DARK, font=get_font(10.5, bold=True))
    draw.text((28, 548), "• Shortage Zone (<75%): 1 Student (10%)", fill=RED_DARK, font=get_font(10.5, bold=True))

    draw_bottom_nav(draw, active_tab="Reports")
    return img

# -------------------------------------------------------------
# 6. SCREEN 6: STUDENT DETAIL / PROFILE
# -------------------------------------------------------------
def make_screenshot_student_profile():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    draw_status_bar(draw)
    
    # Header with Back
    draw.rectangle([0, 36, W, 86], fill=CARD_BG)
    draw.line([0, 86, W, 86], fill=BORDER, width=1)
    draw.text((18, 50), "←", fill=TEXT_MAIN, font=get_font(18, bold=True))
    draw.text((50, 50), "Student Profile", fill=TEXT_MAIN, font=get_font(17, bold=True))
    draw.text((W - 40, 50), "✏️", fill=PRIMARY, font=get_font(16))
    
    # Profile Card
    draw.rounded_rectangle([18, 98, W - 18, 225], radius=14, fill=CARD_BG, outline=BORDER, width=1)
    draw.ellipse([W // 2 - 28, 108, W // 2 + 28, 164], fill=PRIMARY_LIGHT)
    draw.text((W // 2 - 12, 126), "RD", fill=PRIMARY, font=get_font(15, bold=True))
    draw.text((W // 2 - 58, 172), "Rohan Deshmukh", fill=TEXT_MAIN, font=get_font(14, bold=True))
    draw.text((W // 2 - 42, 192), "Roll No: MCA-03", fill=TEXT_MUTED, font=get_font(11))
    
    # Attendance Percentage Card
    draw.rounded_rectangle([18, 238, W - 18, 385], radius=14, fill=CARD_BG, outline=RED, width=1)
    draw.text((28, 250), "Attendance Status", fill=TEXT_MAIN, font=get_font(13, bold=True))
    draw.text((28, 268), "8 Total Lectures Held", fill=TEXT_MUTED, font=get_font(10))
    draw.text((W - 85, 250), "43.8%", fill=RED, font=get_font(22, bold=True))
    
    # Progress Bar
    draw.rounded_rectangle([28, 292, W - 28, 300], radius=4, fill=BORDER)
    draw.rounded_rectangle([28, 292, 28 + int((W - 56) * 0.438), 300], radius=4, fill=RED)
    
    # Warning Alert Box
    draw.rounded_rectangle([28, 312, W - 28, 372], radius=10, fill=RED_LIGHT, outline=RED, width=1)
    draw.text((36, 320), "⚠️ Attendance Shortage Alert", fill=RED_DARK, font=get_font(11, bold=True))
    draw.text((36, 340), "Student is below minimum 75% college criteria.", fill=TEXT_MUTED, font=get_font(9.5))
    draw.text((36, 355), "Needs next 10 consecutive classes to reach 75%.", fill=RED_DARK, font=get_font(9.5, bold=True))
    
    # Contact Info
    draw.rounded_rectangle([18, 398, W - 18, 480], radius=12, fill=CARD_BG, outline=BORDER, width=1)
    draw.text((28, 410), "Contact Details", fill=TEXT_MAIN, font=get_font(12, bold=True))
    draw.text((28, 432), "✉️  rohan.deshmukh@college.edu", fill=TEXT_MAIN, font=get_font(11))
    draw.text((28, 454), "📞  +91 98765 43212", fill=TEXT_MAIN, font=get_font(11))
    
    # History Timeline
    draw.text((18, 495), "Attendance History (Last 8 Sessions)", fill=TEXT_MAIN, font=get_font(13, bold=True))
    
    history_items = [
        ("2026-10-21", "Core Computer Science", "Absent", RED, RED_LIGHT),
        ("2026-10-20", "Data Structures & Algos", "Present", GREEN, GREEN_LIGHT),
        ("2026-10-19", "Database Systems", "Absent", RED, RED_LIGHT),
        ("2026-10-18", "Computer Networks", "Present", GREEN, GREEN_LIGHT),
        ("2026-10-17", "Software Engineering", "Absent", RED, RED_LIGHT),
    ]
    
    hy = 520
    for dt, subj, st, col, bg_st in history_items:
        draw.rounded_rectangle([18, hy, W - 18, hy + 50], radius=10, fill=CARD_BG, outline=BORDER, width=1)
        draw.text((28, hy + 10), dt, fill=TEXT_MAIN, font=get_font(11, bold=True))
        draw.text((28, hy + 28), subj, fill=TEXT_MUTED, font=get_font(9.5))
        
        draw.rounded_rectangle([W - 90, hy + 12, W - 28, hy + 38], radius=12, fill=bg_st)
        draw.text((W - 78, hy + 18), st, fill=col, font=get_font(10.5, bold=True))
        hy += 58

    return img

def main():
    out_dir = r"D:\1.MCA-PROJECTS\student-attendance-app\screenshots"
    os.makedirs(out_dir, exist_ok=True)
    
    screens = [
        ("1_dashboard.png", make_screenshot_dashboard),
        ("2_student_directory.png", make_screenshot_students),
        ("3_add_student.png", make_screenshot_add_student),
        ("4_mark_attendance.png", make_screenshot_mark_attendance),
        ("5_defaulters_report.png", make_screenshot_defaulters),
        ("6_student_profile.png", make_screenshot_student_profile),
    ]
    
    for filename, fn in screens:
        path = os.path.join(out_dir, filename)
        img = fn()
        img.save(path, quality=95)
        print(f"Generated: {path}")

if __name__ == "__main__":
    main()

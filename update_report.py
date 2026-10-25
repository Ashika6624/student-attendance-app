import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def remove_table_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        '<w:tblBorders ' + nsdecls('w') + '>'
        '<w:top w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        '<w:left w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        '<w:bottom w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        '<w:right w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        '<w:insideH w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        '<w:insideV w:val="none" w:sz="0" w:space="0" w:color="auto"/>'
        '</w:tblBorders>'
    )
    tblPr.append(borders)

def set_cell_margins(cell, top=100, bottom=100, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        '<w:tcMar ' + nsdecls('w') + '>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        '</w:tcMar>'
    )
    tcPr.append(tcMar)

def populate_cell(cell, title_text, img_path, caption_text, width_in=2.45):
    set_cell_margins(cell, top=120, bottom=120, left=80, right=80)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.TOP
    
    # 1. Title paragraph
    p_title = cell.paragraphs[0]
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(4)
    p_title.paragraph_format.space_after = Pt(6)
    r_title = p_title.add_run(title_text)
    r_title.bold = True
    r_title.font.name = "Arial"
    r_title.font.size = Pt(10.5)
    r_title.font.color.rgb = RGBColor(15, 23, 42)
    
    # 2. Image paragraph
    p_img = cell.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(0)
    p_img.paragraph_format.space_after = Pt(6)
    r_img = p_img.add_run()
    r_img.add_picture(img_path, width=Inches(width_in))
    
    # 3. Caption paragraph
    p_cap = cell.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_before = Pt(0)
    p_cap.paragraph_format.space_after = Pt(8)
    r_cap = p_cap.add_run(caption_text)
    r_cap.italic = True
    r_cap.font.name = "Arial"
    r_cap.font.size = Pt(8.5)
    r_cap.font.color.rgb = RGBColor(71, 85, 105)

def update_report():
    src_docx = r"C:/Users/Ashika Poojary/.gemini/antigravity/brain/197550ee-e703-4ceb-a439-2706365a79f7/.user_uploaded/media_1792933153294_de09a179.docx"
    screenshots_dir = r"D:\1.MCA-PROJECTS\student-attendance-app\screenshots"
    
    doc = docx.Document(src_docx)
    
    # Find Section 5 and Section 6
    idx_5 = None
    idx_6 = None
    for i, p in enumerate(doc.paragraphs):
        t = p.text.strip()
        if t == "5. Snapshots":
            idx_5 = i
        elif t == "6. Future Enhancements":
            idx_6 = i
            
    if idx_5 is None or idx_6 is None:
        raise ValueError(f"Could not find section boundaries: idx_5={idx_5}, idx_6={idx_6}")
        
    p6 = doc.paragraphs[idx_6]
    
    # Remove existing paragraphs between Section 5 and Section 6
    paras_to_remove = [doc.paragraphs[i] for i in range(idx_5 + 1, idx_6)]
    for p in paras_to_remove:
        p._element.getparent().remove(p._element)
        
    # Snapshots data
    pairs = [
        (
            ("Figure 5.1: Mobile Dashboard", 
             os.path.join(screenshots_dir, "1_dashboard.png"),
             "Figure 5.1: Executive Dashboard with Attendance Rate %, Today's Roll Call Status, and Defaulter Alert"),
            ("Figure 5.2: Student Directory", 
             os.path.join(screenshots_dir, "2_student_directory.png"),
             "Figure 5.2: Searchable Student Roster with Batch Filter (MCA 2026-27) and Individual Attendance Progress")
        ),
        (
            ("Figure 5.3: Student Enrollment Form", 
             os.path.join(screenshots_dir, "3_add_student.png"),
             "Figure 5.3: Student Registration Form with USN, Roll Number, Section, Gender, and Contact Validation"),
            ("Figure 5.4: Daily Roll Call Register", 
             os.path.join(screenshots_dir, "4_mark_attendance.png"),
             "Figure 5.4: Daily Attendance Register with Date Picker, Bulk Actions ('Mark All Present'), and P/A/L Chips")
        ),
        (
            ("Figure 5.5: Defaulters & Shortage Analysis", 
             os.path.join(screenshots_dir, "5_defaulters_report.png"),
             "Figure 5.5: Automated Defaulter Tracking with Shortage Severity and 75% Recovery Threshold Calculations"),
            ("Figure 5.6: Student Profile & History Timeline", 
             os.path.join(screenshots_dir, "6_student_profile.png"),
             "Figure 5.6: Individual Student Dossier with Circular Attendance Gauge, Shortage Banner, and Session Timeline")
        )
    ]
    
    # 1. Section 5 intro paragraph
    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.space_before = Pt(6)
    p_intro.paragraph_format.space_after = Pt(12)
    p_intro.paragraph_format.line_spacing = 1.15
    r_intro = p_intro.add_run(
        "The following snapshots present the responsive mobile application running natively in portrait orientation "
        "(viewport 420 × 890 dp) on an Android smartphone. The user interface prioritizes clarity, thumb-accessible "
        "controls, real-time visual feedback, and zero-latency performance during classroom roll call marking."
    )
    r_intro.font.name = "Arial"
    r_intro.font.size = Pt(10)
    r_intro.font.color.rgb = RGBColor(51, 65, 85)
    p6._element.addprevious(p_intro._element)
    
    for pair_idx, (screen_left, screen_right) in enumerate(pairs):
        table = doc.add_table(rows=1, cols=2)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        remove_table_borders(table)
        
        # Set widths (each column 3.0 inches)
        for row in table.rows:
            row.cells[0].width = Inches(3.0)
            row.cells[1].width = Inches(3.0)
            
        populate_cell(table.cell(0, 0), screen_left[0], screen_left[1], screen_left[2], width_in=2.45)
        populate_cell(table.cell(0, 1), screen_right[0], screen_right[1], screen_right[2], width_in=2.45)
        
        p6._element.addprevious(table._element)
        
        # Add page break after each pair except before Section 6 where we add a clean page break
        p_break = doc.add_paragraph()
        p_break.paragraph_format.space_before = Pt(4)
        p_break.paragraph_format.space_after = Pt(4)
        run_break = p_break.add_run()
        run_break.add_break(docx.enum.text.WD_BREAK.PAGE)
        p6._element.addprevious(p_break._element)

    # Save outputs
    out_path_1 = r"D:\1.MCA-PROJECTS\StudentAttendanceApp_ProjectReport_Final.docx"
    out_path_2 = r"D:\1.MCA-PROJECTS\student-attendance-app\docs\StudentAttendanceApp_ProjectReport.docx"
    
    doc.save(out_path_1)
    doc.save(out_path_2)
    print(f"Successfully generated:\n  - {out_path_1}\n  - {out_path_2}")

if __name__ == "__main__":
    update_report()

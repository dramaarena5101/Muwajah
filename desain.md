# 6102 CREATIVE SYSTEM
## Design System & UI/UX Specification

**Version:** 1.0  
**Design Direction:** Modern, restrained, professional, functional  
**Visual Reference:** Modern Laravel-style administration interfaces  
**Primary Principle:** Product UI first, decoration second.

---

# 1. DESIGN PHILOSOPHY

6102 Creative System harus terasa seperti aplikasi kerja profesional, bukan landing page startup dan bukan dashboard hasil template AI.

Karakter visual:

- clean
- modern
- quiet
- editorial
- structured
- professional
- efficient
- responsive

UI harus terasa cocok digunakan selama berjam-jam oleh Creative Management.

---

# 2. ANTI AI-SLOP

## Strictly Avoid

### Visual

- excessive gradients
- glassmorphism
- neon
- excessive blur
- oversized cards
- floating decorative blobs
- abstract 3D decorations
- excessive rounded containers
- excessive shadows
- excessive pill UI

### Content

- “Unlock your creative potential”
- “Your creative journey starts here”
- generic AI marketing language
- fake metrics
- unnecessary motivational text

### Icons

Jangan menggunakan emoji sebagai icon.

Contoh yang DILARANG:

- 📷
- 🎨
- 🎬
- ✨
- 🚀
- 📁

Gunakan icon library profesional seperti:
- Lucide
- Heroicons

Icon harus berfungsi sebagai visual aid, bukan dekorasi.

---

# 3. VISUAL CHARACTER

Referensi rasa:

> Modern Laravel administration panel + editorial creative workspace.

Bukan:

> Dribbble landing page + AI-generated SaaS dashboard.

Prioritas:

1. hierarchy
2. readability
3. speed
4. usability
5. consistency
6. aesthetics

---

# 4. COLOR SYSTEM

Gunakan neutral-first color system.

## Base

- Background: off-white / very light neutral
- Surface: white
- Border: light neutral
- Primary text: near-black
- Secondary text: muted neutral

## Accent

Gunakan satu primary accent yang berasal dari brand 6102 setelah brand identity ditetapkan.

Jangan membuat banyak accent color hanya agar UI terlihat ramai.

## Semantic Colors

Success:
- green

Warning:
- amber

Danger:
- red

Info:
- blue

Semantic colors hanya digunakan untuk status dan feedback.

---

# 5. TYPOGRAPHY

Recommended:

### Primary UI Font

Inter atau Geist.

### Optional Editorial Font

Jika dibutuhkan untuk campaign/brand showcase, gunakan font khusus hanya pada area yang memang membutuhkan karakter editorial.

Dashboard tetap menggunakan sans-serif.

Hierarchy:

- Display: 32–40 px
- Page title: 24–28 px
- Section title: 18–20 px
- Body: 14–16 px
- Metadata: 12–13 px

Jangan menggunakan terlalu banyak font weight.

---

# 6. SPACING

Gunakan spacing system konsisten berbasis 4/8 px.

Contoh:

- 4
- 8
- 12
- 16
- 24
- 32
- 48

Jangan membuat setiap component memiliki spacing sendiri.

---

# 7. BORDER RADIUS

Gunakan radius moderat.

Recommended:

- button: 6–8 px
- input: 6–8 px
- card: 8–12 px
- modal: 10–12 px

Hindari semua komponen berbentuk kapsul.

---

# 8. SHADOW

Gunakan shadow sangat ringan.

Primary hierarchy sebaiknya berasal dari:
- spacing
- border
- typography
- surface contrast

bukan dari shadow.

---

# 9. ICONOGRAPHY

Gunakan satu icon system.

Recommended:

**Lucide Icons**

Rules:

- consistent stroke
- 16–20 px
- never mix unrelated icon styles
- icon + text untuk navigation
- icon-only hanya untuk action yang sudah familiar
- tooltip untuk icon-only action

Tidak ada emoji icon.

---

# 10. LAYOUT

Desktop:

```text
┌───────────────────────────────────────────────────────────┐
│ Sidebar │ Topbar                                          │
│         ├─────────────────────────────────────────────────┤
│         │                                                 │
│         │ Main Content                                    │
│         │                                                 │
│         │                                                 │
│         │                                                 │
└───────────────────────────────────────────────────────────┘
```

Sidebar:
- fixed/sticky
- collapsible
- compact
- role-aware

Topbar:
- breadcrumbs
- page context
- search bila diperlukan
- notifications
- user menu

---

# 11. SIDEBAR

Navigation:

```text
Dashboard

WORK
Requests
Projects
Tasks
Content
Calendar

NETWORK
Talent
Campuses
Events

LIBRARY
Brand
Assets

GOVERNANCE
Approvals
Activity

SYSTEM
Settings
```

Section label kecil dan muted.

Jangan menggunakan icon berbeda-beda secara dekoratif untuk setiap submenu.

---

# 12. DASHBOARD

Dashboard bukan kumpulan card statistik.

Struktur:

```text
Dashboard
Good morning, Ahmad.

[Active Projects] [Pending Requests] [Approvals] [Deadlines]

My Tasks
──────────────────────────────

Upcoming
──────────────────────────────

Active Projects
──────────────────────────────

Recent Activity
──────────────────────────────
```

Gunakan card hanya ketika membantu grouping.

---

# 13. TABLE DESIGN

Karena aplikasi adalah operational system, table menjadi komponen penting.

Table:

- compact
- readable
- sticky header jika perlu
- row hover subtle
- sorting
- filtering
- pagination

Contoh:

```text
Project       Campus     Lead       Status       Deadline
PG Identity   Central    Ahmad      Production   24 Oct
Documentary   Campus A   Budi       Review       28 Oct
```

Hindari table dengan terlalu banyak icon action.

Gunakan:
- text action
- dropdown action
- contextual action

---

# 14. STATUS SYSTEM

Status menggunakan restrained badge.

Contoh:

`Production`

`Review`

`Approved`

`Blocked`

Badge tidak boleh terlalu besar.

Gunakan warna semantic seperlunya.

---

# 15. BUTTONS

Primary:
- solid

Secondary:
- outline / subtle

Tertiary:
- text

Danger:
- destructive

Contoh:

```text
[Create Project]
[Save]
[Submit for Review]

Cancel
View Details
```

Jangan membuat setiap button menggunakan warna berbeda.

---

# 16. FORM DESIGN

Form harus memiliki:

- label jelas
- helper text bila diperlukan
- required indicator
- validation message
- grouped sections

Contoh:

```text
PROJECT INFORMATION

Project Name
[________________________]

Project Type
[6102 Project             ]

Campus Scope
[Central / Multiple       ]

Deadline
[________________________]
```

Jangan menggunakan placeholder sebagai pengganti label.

---

# 17. PROJECT DETAIL

Header:

```text
Panggung Gembira 6102 Identity

6102 Project
Production
Deadline: 24 October 2026

[Edit] [More]
```

Tabs:

```text
Overview
Tasks
Team
Assets
Reviews
Activity
```

Overview:

- objective
- brief
- timeline
- team
- progress
- latest update

---

# 18. REQUEST DETAIL

Struktur:

```text
REQUEST #REQ-0012

Content Request
Campus A
Submitted by Ahmad

Purpose
...

Content Needed
...

Deadline
...

REFERENCE
...

Activity
...
```

Action:

```text
[Accept Request]
[Reject]
[Request Information]
```

---

# 19. TALENT DIRECTORY

Desktop:

```text
Talent

[Search talent...] [Division] [Campus] [Skill] [Availability]

────────────────────────────────────────

Ahmad
Photography · Campus A
Advanced
Event Photography
Portrait

Budi
Graphic Design · Campus B
Intermediate
Brand Identity
Social Media
```

Gunakan list/grid secukupnya.

Jangan membuat profile card penuh dekorasi.

---

# 20. TALENT PROFILE

Header:

```text
Ahmad
Photography
Campus A

Advanced

Portfolio
Experience
Equipment
Availability
Project History
```

Portfolio dapat menggunakan thumbnail, tetapi jangan menggunakan masonry grid besar sebagai default.

---

# 21. CONTENT CALENDAR

Calendar harus clean.

Gunakan:

- subtle borders
- compact event blocks
- filter bar
- status indicator

Views:

- Month
- Week
- List

Jangan menggunakan gradient event cards.

---

# 22. CONTENT DETAIL

Structure:

```text
Content

October Event Recap

Campus
Campus A

Format
Reels

Platform
Instagram

Status
Review

Caption
...

Assets
...

Approval
...
```

Action:

```text
[Submit for Review]
[Request Revision]
[Approve]
```

Action berubah sesuai permission.

---

# 23. APPROVAL UI

Approval page harus terasa serius.

```text
Approval Request

Logo 6102 — Version 03

Submitted by
Ahmad

Preview

[Asset Preview]

Review Notes
[________________________]

[Request Revision] [Approve]
```

Approval history:

```text
Version 01 — Revision Requested
Version 02 — Revision Requested
Version 03 — Approved
```

---

# 24. BRAND CENTER

Brand Center boleh memiliki visual lebih editorial dibanding dashboard.

Structure:

```text
Brand Center

Brand Guidelines
Logo
Color
Typography
Graphic Language
Photography
Motion
Social Templates
```

Asset preview besar hanya ketika memang membantu.

---

# 25. ASSET LIBRARY

Gunakan hybrid:

- table view untuk management
- grid view untuk visual assets

Filter:

- project
- campus
- division
- asset type
- copyright
- date

Asset card sederhana:

```text
[Preview]

Logo-6102-v03.svg
Brand
Approved
24 Oct 2026
```

---

# 26. ACTIVITY

Activity timeline:

```text
10:21
Ahmad submitted Logo 6102 v3

10:45
Creative Lead requested revision

11:20
Ahmad uploaded revision

12:05
Council approved the asset
```

Tidak perlu icon besar untuk setiap activity.

---

# 27. EMPTY STATES

Empty state harus informatif.

Contoh:

```text
No active projects

Projects assigned to your team will appear here.

[Create Project]
```

Hindari:
- illustration besar
- emoji
- motivational quote

---

# 28. ERROR STATES

Error harus menjelaskan:

1. apa yang terjadi;
2. apakah data tersimpan;
3. apa yang dapat dilakukan user.

Contoh:

```text
Unable to save project

Your changes were not saved.
Check your connection and try again.

[Retry]
```

---

# 29. LOADING STATES

Gunakan skeleton yang sederhana.

Hindari:
- spinner di seluruh halaman
- animation berlebihan
- shimmer yang terlalu mencolok

Untuk action cepat:

`Saving...`

`Uploading...`

`Processing...`

---

# 30. RESPONSIVE DESIGN

## Desktop

Sidebar + content.

## Tablet

Collapsible sidebar.

## Mobile

Bottom navigation atau compact navigation untuk primary actions.

Tables harus berubah menjadi:
- horizontal scroll;
- atau responsive list;
- bukan table yang terlalu kecil.

Form harus single-column pada mobile.

---

# 31. MOBILE PRIORITIES

Mobile harus nyaman untuk:

- melihat task
- update task
- submit request
- review notification
- melihat approval
- melihat project
- upload asset
- update availability

Desktop lebih diprioritaskan untuk:
- management
- calendar
- tables
- asset management
- reporting

---

# 32. MODAL

Modal hanya digunakan untuk:
- confirmation
- quick edit
- small form
- destructive action

Untuk workflow besar gunakan dedicated page.

Jangan membuat modal bertingkat.

---

# 33. DRAWER

Drawer dapat digunakan untuk:
- quick preview
- asset metadata
- task detail
- activity detail

Tidak untuk form kompleks.

---

# 34. SEARCH

Global search future-ready.

Search target:
- projects
- content
- talents
- assets
- campuses
- events

Search result harus dikelompokkan berdasarkan entity.

---

# 35. DESIGN COMPONENT INVENTORY

Build reusable components:

- Button
- Input
- Select
- Textarea
- Checkbox
- Radio
- Date Picker
- Combobox
- Table
- Data Table
- Badge
- Avatar
- Tabs
- Dialog
- Drawer
- Dropdown
- Tooltip
- Breadcrumb
- Pagination
- Empty State
- Skeleton
- Alert
- Timeline
- File Preview
- Upload
- Filter Bar
- Command Search

---

# 36. FRONTEND ARCHITECTURE

Recommended:

```text
app/
├── (auth)/
├── dashboard/
├── requests/
├── projects/
├── tasks/
├── content/
├── calendar/
├── talent/
├── campuses/
├── events/
├── brand/
├── assets/
├── approvals/
├── activity/
└── settings/
```

Components:

```text
components/
├── ui/
├── layout/
├── dashboard/
├── projects/
├── requests/
├── content/
├── talent/
├── assets/
└── approvals/
```

Business logic tidak diletakkan sembarangan di component UI.

---

# 37. DESIGN TOKENS

Gunakan CSS variables untuk:

- background
- foreground
- muted
- border
- primary
- destructive
- success
- warning
- radius
- spacing

Jangan hardcode warna di setiap component.

---

# 38. ACCESSIBILITY

Minimum:

- keyboard navigation
- visible focus
- semantic HTML
- labels
- aria-label untuk icon-only button
- sufficient contrast
- error messaging
- no information conveyed only through color

---

# 39. UX RULES

1. User selalu tahu berada di halaman apa.
2. User selalu tahu status pekerjaan.
3. Primary action jelas.
4. Destructive action tidak mudah tertekan.
5. Form validation muncul dekat field.
6. Data penting tidak tersembunyi di modal tanpa alasan.
7. Tidak ada loading tanpa feedback.
8. Tidak ada action yang silent.
9. Permission-sensitive UI harus jelas.
10. Semua workflow memiliki final state.

---

# 40. DESIGN QUALITY CHECKLIST

Sebelum sebuah halaman dianggap selesai:

### Visual
- consistent spacing
- consistent typography
- consistent border
- consistent icon
- no unnecessary decoration

### UX
- primary action clear
- status clear
- errors understandable
- empty state useful
- responsive

### Product
- permission respected
- workflow clear
- data relationship clear
- no duplicate functionality

---

# 41. CORE VISUAL PRINCIPLE

6102 Creative System harus terlihat:

> **Professional enough to manage an organization.**

Tetapi juga:

> **Creative enough to belong to a creative ecosystem.**

Kreativitas tidak harus diwujudkan dengan UI yang ramai.

Karakter creative system ditunjukkan melalui:
- typography
- photography
- brand assets
- content
- editorial composition

Sedangkan application UI tetap:

> calm, structured, precise, and professional.

---

# 42. FINAL DESIGN STATEMENT

6102 Creative System bukan showcase design.

Ini adalah **working environment**.

Karena itu:

> Function before decoration.  
> Clarity before novelty.  
> Consistency before trend.  
> System before spectacle.

Tidak menggunakan emoji sebagai icon.

Tidak menggunakan AI-slop visual.

Tidak menggunakan dekorasi yang tidak memiliki fungsi.

UI harus sederhana, modern, profesional, dan dapat digunakan dalam jangka panjang.

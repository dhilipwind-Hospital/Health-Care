# Help Center System - Proof of Concept
## Module: "Adding New Organization" Documentation

---

## 🎯 **Overview**

This POC demonstrates a comprehensive Help Center system with:
- **Admin CMS**: Super Admin can create/edit help articles
- **Rich Content**: Text, images, videos, code snippets
- **Screenshot Management**: Upload, annotate, version control
- **Contextual Help**: "?" icons linking to relevant articles
- **Search & Navigation**: Full-text search, categories, tags
- **User Feedback**: Ratings, comments, analytics

---

## 📊 **Database Schema**

### **1. help_categories**
```sql
CREATE TABLE help_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(100), -- Ant Design icon name
  parent_id UUID REFERENCES help_categories(id),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample categories
INSERT INTO help_categories (name, slug, icon, order_index) VALUES
('Getting Started', 'getting-started', 'RocketOutlined', 1),
('SaaS Management', 'saas-management', 'CrownOutlined', 2),
('Global Administration', 'global-admin', 'SettingOutlined', 3),
('Clinical Operations', 'clinical-ops', 'HeartOutlined', 4),
('Hospital Operations', 'hospital-ops', 'LayoutOutlined', 5);

-- Subcategories
INSERT INTO help_categories (name, slug, icon, parent_id, order_index) VALUES
('Organizations', 'organizations', 'BankOutlined', 
  (SELECT id FROM help_categories WHERE slug = 'saas-management'), 1),
('Subscriptions', 'subscriptions', 'CreditCardOutlined',
  (SELECT id FROM help_categories WHERE slug = 'saas-management'), 2);
```

### **2. help_articles**
```sql
CREATE TABLE help_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES help_categories(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) UNIQUE NOT NULL,
  excerpt TEXT, -- Short summary (150 chars)
  content TEXT NOT NULL, -- Rich HTML content
  content_markdown TEXT, -- Markdown version for editing
  
  -- Metadata
  author_id UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  featured BOOLEAN DEFAULT false,
  
  -- SEO & Search
  meta_keywords TEXT[], -- Array of keywords
  search_vector TSVECTOR, -- Full-text search
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  avg_time_spent INTEGER DEFAULT 0, -- seconds
  
  -- Versioning
  version INTEGER DEFAULT 1,
  previous_version_id UUID REFERENCES help_articles(id),
  
  -- Timestamps
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Full-text search index
  CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived'))
);

-- Create full-text search index
CREATE INDEX help_articles_search_idx ON help_articles USING GIN(search_vector);

-- Trigger to update search_vector
CREATE TRIGGER help_articles_search_update
BEFORE INSERT OR UPDATE ON help_articles
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, content, excerpt);
```

### **3. help_screenshots**
```sql
CREATE TABLE help_screenshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES help_articles(id) ON DELETE CASCADE,
  filename VARCHAR(500) NOT NULL,
  original_url TEXT NOT NULL, -- Original upload
  thumbnail_url TEXT, -- Auto-generated thumbnail
  optimized_url TEXT, -- CDN optimized version
  
  -- Metadata
  caption TEXT,
  alt_text VARCHAR(255),
  order_index INTEGER DEFAULT 0,
  
  -- Annotations (JSON)
  annotations JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"type": "arrow", "x": 100, "y": 200, "color": "red"}]
  
  -- File info
  file_size INTEGER, -- bytes
  width INTEGER,
  height INTEGER,
  mime_type VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **4. help_videos**
```sql
CREATE TABLE help_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES help_articles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  video_url TEXT NOT NULL, -- YouTube, Vimeo, or self-hosted
  thumbnail_url TEXT,
  duration INTEGER, -- seconds
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **5. help_tags**
```sql
CREATE TABLE help_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE help_article_tags (
  article_id UUID REFERENCES help_articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES help_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
```

### **6. help_feedback**
```sql
CREATE TABLE help_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id UUID REFERENCES help_articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- Feedback
  is_helpful BOOLEAN, -- true = helpful, false = not helpful
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  
  -- Context
  user_role VARCHAR(50),
  page_url TEXT, -- Where they were when they accessed help
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **7. help_search_logs**
```sql
CREATE TABLE help_search_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  search_query VARCHAR(500) NOT NULL,
  results_count INTEGER,
  clicked_article_id UUID REFERENCES help_articles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔌 **Backend API Endpoints**

### **Admin CMS Endpoints (Super Admin Only)**

#### **Categories Management**
```typescript
// GET /api/help/admin/categories
// List all categories with hierarchy
Response: {
  success: true,
  data: [
    {
      id: "uuid",
      name: "SaaS Management",
      slug: "saas-management",
      icon: "CrownOutlined",
      children: [
        { id: "uuid", name: "Organizations", slug: "organizations", ... }
      ]
    }
  ]
}

// POST /api/help/admin/categories
// Create new category
Body: { name, slug, icon, parent_id?, order_index? }

// PUT /api/help/admin/categories/:id
// Update category

// DELETE /api/help/admin/categories/:id
// Delete category (cascade to articles)
```

#### **Articles Management**
```typescript
// GET /api/help/admin/articles
// List all articles with filters
Query: ?status=draft&category_id=uuid&search=keyword

Response: {
  success: true,
  data: {
    articles: [...],
    pagination: { page, limit, total }
  }
}

// GET /api/help/admin/articles/:id
// Get single article for editing
Response: {
  success: true,
  data: {
    id, title, slug, content, content_markdown,
    category_id, status, screenshots: [...], videos: [...],
    tags: [...], version, created_at, updated_at
  }
}

// POST /api/help/admin/articles
// Create new article
Body: {
  category_id: "uuid",
  title: "How to Add New Organization",
  slug: "add-new-organization",
  excerpt: "Step-by-step guide...",
  content_markdown: "# Overview\n\n...",
  content: "<h1>Overview</h1>...", // Auto-generated from markdown
  meta_keywords: ["organization", "add", "create"],
  status: "draft"
}

// PUT /api/help/admin/articles/:id
// Update article (creates new version)

// DELETE /api/help/admin/articles/:id
// Delete article

// POST /api/help/admin/articles/:id/publish
// Publish draft article

// POST /api/help/admin/articles/:id/archive
// Archive article
```

#### **Screenshot Management**
```typescript
// POST /api/help/admin/screenshots
// Upload screenshot
Body: FormData {
  file: File,
  article_id: "uuid",
  caption: "Click on Add Organization button",
  order_index: 1
}

Response: {
  success: true,
  data: {
    id: "uuid",
    original_url: "https://cdn.../screenshot-1.png",
    thumbnail_url: "https://cdn.../screenshot-1-thumb.png",
    optimized_url: "https://cdn.../screenshot-1-opt.png"
  }
}

// PUT /api/help/admin/screenshots/:id/annotate
// Add annotations to screenshot
Body: {
  annotations: [
    { type: "arrow", x: 100, y: 200, color: "red", label: "1" },
    { type: "highlight", x: 50, y: 150, width: 200, height: 50, color: "yellow" }
  ]
}

// DELETE /api/help/admin/screenshots/:id
// Delete screenshot
```

#### **Analytics**
```typescript
// GET /api/help/admin/analytics
// Get help center analytics
Response: {
  success: true,
  data: {
    total_articles: 150,
    total_views: 12500,
    avg_helpfulness: 4.2,
    top_articles: [...],
    top_searches: [...],
    recent_feedback: [...]
  }
}
```

### **Public Help Center Endpoints**

#### **Browse & Search**
```typescript
// GET /api/help/categories
// Get all categories (published articles only)

// GET /api/help/categories/:slug/articles
// Get articles in category

// GET /api/help/articles/:slug
// Get single article (increments view_count)

// GET /api/help/search?q=keyword
// Full-text search across articles
Response: {
  success: true,
  data: {
    results: [
      {
        id, title, slug, excerpt, category,
        highlight: "...matched text...",
        relevance_score: 0.95
      }
    ],
    total: 15
  }
}

// GET /api/help/popular
// Get most viewed articles

// GET /api/help/featured
// Get featured articles
```

#### **Feedback**
```typescript
// POST /api/help/articles/:id/feedback
// Submit feedback
Body: {
  is_helpful: true,
  rating: 5,
  comment: "Very clear instructions!"
}

// POST /api/help/articles/:id/view
// Track article view (analytics)
```

---

## 🎨 **Admin CMS UI Design**

### **Page: Help Center Management** (`/admin/help-center`)

#### **Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Help Center Management                    [+ New Article]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 Quick Stats                                              │
│  ┌──────────┬──────────┬──────────┬──────────┐             │
│  │ Articles │  Views   │ Helpful  │ Searches │             │
│  │   150    │  12.5K   │   92%    │  2,340   │             │
│  └──────────┴──────────┴──────────┴──────────┘             │
│                                                               │
│  🔍 Search: [________________]  Filter: [All] [Draft] [Published] │
│                                                               │
│  📁 Categories                    📄 Articles                │
│  ┌─────────────────────┐  ┌──────────────────────────────┐ │
│  │ ▼ SaaS Management   │  │ Title              Status View│ │
│  │   ▶ Organizations   │  │ Add New Org        ✓     1.2K│ │
│  │   ▶ Subscriptions   │  │ Manage Subs        ✓      850│ │
│  │ ▼ Global Admin      │  │ Edit Org           📝     120│ │
│  │   ▶ Users           │  │ Suspend Org        ✓      340│ │
│  │   ▶ Roles           │  │                              │ │
│  └─────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

#### **Page: Article Editor** (`/admin/help-center/articles/new`)

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Articles                    [Save Draft] [Publish]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Title: [How to Add a New Organization________________]     │
│  Slug:  [add-new-organization_____________________]         │
│  Category: [SaaS Management > Organizations ▼]              │
│                                                               │
│  ┌─ Tabs ─────────────────────────────────────────────┐    │
│  │ [Content] [Screenshots] [Videos] [Settings]         │    │
│  ├─────────────────────────────────────────────────────┤    │
│  │                                                      │    │
│  │  Rich Text Editor (Markdown + WYSIWYG)             │    │
│  │  ┌────────────────────────────────────────────┐    │    │
│  │  │ B I U  H1 H2 H3  • 1. ⎇  🔗 📷 📹 </>    │    │    │
│  │  ├────────────────────────────────────────────┤    │    │
│  │  │ # Overview                                 │    │    │
│  │  │                                            │    │    │
│  │  │ This guide shows you how to add a new     │    │    │
│  │  │ organization to your SaaS platform.       │    │    │
│  │  │                                            │    │    │
│  │  │ ## Prerequisites                           │    │    │
│  │  │ - Super Admin access                       │    │    │
│  │  │ - Organization details ready               │    │    │
│  │  │                                            │    │    │
│  │  └────────────────────────────────────────────┘    │    │
│  │                                                      │    │
│  │  [Preview Mode] [Split View]                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Screenshots Tab:                                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ [+ Upload Screenshot]                                │    │
│  │                                                       │    │
│  │ 📷 Screenshot 1: "Organizations page"                │    │
│  │    [🖊️ Annotate] [↑] [↓] [🗑️]                        │    │
│  │                                                       │    │
│  │ 📷 Screenshot 2: "Add organization form"             │    │
│  │    [🖊️ Annotate] [↑] [↓] [🗑️]                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Settings Tab:                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Excerpt: [Short summary for search results____]     │    │
│  │ Keywords: [organization] [add] [create] [+ Add]     │    │
│  │ Featured: ☐ Show on homepage                        │    │
│  │ Related Articles: [Select articles...▼]             │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

#### **Screenshot Annotation Tool**

```
┌─────────────────────────────────────────────────────────────┐
│  Annotate Screenshot                        [Save] [Cancel] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Tools: [➡️ Arrow] [⬜ Box] [🖍️ Highlight] [🔢 Number] [T Text] │
│  Color: [🔴] [🟡] [🟢] [🔵]                                  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                         │  │
│  │     [Screenshot Preview with Annotations]              │  │
│  │                                                         │  │
│  │     ➡️ 1. Click here                                   │  │
│  │     ⬜ 2. Fill this form                               │  │
│  │                                                         │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  Caption: [Click on the Add Organization button_______]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌐 **Help Center Frontend UI**

### **Page: Help Center Home** (`/help`)

```
┌─────────────────────────────────────────────────────────────┐
│  🏥 Ayphen Care Help Center                                 │
│  How can we help you today?                                 │
│                                                               │
│  🔍 [Search for help articles, guides, tutorials...____]    │
│                                                               │
│  📚 Browse by Category                                       │
│  ┌──────────────┬──────────────┬──────────────┬──────────┐ │
│  │ 🚀 Getting   │ 👑 SaaS      │ ⚙️ Global    │ ❤️ Clinical│ │
│  │    Started   │    Management│    Admin     │    Ops    │ │
│  │              │              │              │           │ │
│  │ 12 articles  │ 25 articles  │ 30 articles  │ 40 articles│ │
│  └──────────────┴──────────────┴──────────────┴──────────┘ │
│                                                               │
│  ⭐ Popular Articles                                         │
│  1. How to Add a New Organization                    1.2K views│
│  2. Managing User Roles & Permissions                  850 views│
│  3. Setting Up Multi-Location Support                  720 views│
│                                                               │
│  🎬 Video Tutorials                                          │
│  [▶️ Getting Started with Ayphen Care (5:30)]               │
│  [▶️ Organization Management Overview (8:15)]               │
└─────────────────────────────────────────────────────────────┘
```

### **Page: Article View** (`/help/articles/add-new-organization`)

```
┌─────────────────────────────────────────────────────────────┐
│  Help Center > SaaS Management > Organizations              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  # How to Add a New Organization                            │
│  Last updated: Feb 26, 2026 • 5 min read • 1,234 views     │
│                                                               │
│  ┌─ Table of Contents ─────────────────────────────────┐    │
│  │ 1. Overview                                          │    │
│  │ 2. Prerequisites                                     │    │
│  │ 3. Step-by-Step Guide                               │    │
│  │ 4. Configuration Options                            │    │
│  │ 5. Troubleshooting                                  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ## 1. Overview                                              │
│  Adding a new organization allows you to onboard a new      │
│  hospital or healthcare facility to your SaaS platform...   │
│                                                               │
│  ## 2. Prerequisites                                         │
│  ✓ Super Admin access                                       │
│  ✓ Organization details (name, email, subdomain)            │
│  ✓ Subscription plan selected                               │
│                                                               │
│  ## 3. Step-by-Step Guide                                   │
│                                                               │
│  ### Step 1: Navigate to Organizations                      │
│  Click on **SaaS Management** → **Organizations** in the    │
│  sidebar menu.                                               │
│                                                               │
│  📷 [Screenshot: Sidebar navigation with arrow]             │
│  ┌────────────────────────────────────────────┐             │
│  │ [Screenshot with annotations showing menu] │             │
│  └────────────────────────────────────────────┘             │
│                                                               │
│  ### Step 2: Click "Add Organization"                       │
│  On the Organizations page, click the **+ Add Organization**│
│  button in the top right corner.                            │
│                                                               │
│  📷 [Screenshot: Organizations page with button highlighted]│
│                                                               │
│  ### Step 3: Fill in Organization Details                   │
│  Complete the form with the following information:          │
│                                                               │
│  | Field          | Description                | Required  │ │
│  |----------------|----------------------------|-----------|│ │
│  | Name           | Hospital/clinic name       | Yes       │ │
│  | Subdomain      | URL prefix (e.g., apollo)  | Yes       │ │
│  | Admin Email    | Primary contact email      | Yes       │ │
│  | Phone          | Contact number             | No        │ │
│  | Address        | Physical location          | No        │ │
│                                                               │
│  📷 [Screenshot: Form with all fields]                      │
│                                                               │
│  💡 **Tip**: Choose a short, memorable subdomain. It will   │
│  become: `subdomain.ayphencare.com`                         │
│                                                               │
│  ### Step 4: Select Subscription Plan                       │
│  Choose the appropriate plan:                                │
│  - **Basic**: Up to 25 users, 10GB storage                  │
│  - **Professional**: Up to 100 users, 100GB storage         │
│  - **Enterprise**: Up to 500 users, 1TB storage             │
│                                                               │
│  📷 [Screenshot: Plan selection]                            │
│                                                               │
│  ### Step 5: Configure Settings (Optional)                  │
│  Expand **Advanced Settings** to configure:                 │
│  - Maximum users limit                                       │
│  - Storage quota                                             │
│  - Feature toggles                                           │
│  - Branding options                                          │
│                                                               │
│  ### Step 6: Review and Create                              │
│  Review all details and click **Create Organization**.      │
│                                                               │
│  ✅ Success! The organization is created and an activation  │
│  email is sent to the admin.                                │
│                                                               │
│  ## 4. What Happens Next?                                   │
│  1. Admin receives welcome email with login credentials     │
│  2. Organization subdomain is activated                      │
│  3. Default roles and permissions are set up                 │
│  4. Admin can start adding users and departments             │
│                                                               │
│  ## 5. Troubleshooting                                      │
│                                                               │
│  **Q: "Subdomain already exists" error**                    │
│  A: Choose a different subdomain. Each must be unique.      │
│                                                               │
│  **Q: Admin didn't receive email**                          │
│  A: Check spam folder or resend from Organizations page.    │
│                                                               │
│  **Q: How to change plan after creation?**                  │
│  A: Go to Subscriptions → Select org → Change Plan          │
│                                                               │
│  ---                                                          │
│                                                               │
│  📹 **Video Tutorial**: [▶️ Watch: Adding Organizations (3:45)]│
│                                                               │
│  📚 **Related Articles**:                                    │
│  - Managing Organization Subscriptions                       │
│  - Editing Organization Details                             │
│  - Suspending or Deleting Organizations                     │
│                                                               │
│  ---                                                          │
│                                                               │
│  Was this article helpful?  [👍 Yes (234)] [👎 No (12)]    │
│                                                               │
│  💬 Comments (5)                                             │
│  [Show comments...]                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔗 **Contextual Help Integration**

### **On Organizations Page** (`/saas/organizations`)

Add a help icon in the page header:

```typescript
// In OrganizationsManagement.tsx
<PageHeader
  title="Organizations Management"
  extra={[
    <Tooltip title="Help & Documentation">
      <Button 
        icon={<QuestionCircleOutlined />}
        onClick={() => window.open('/help/articles/add-new-organization', '_blank')}
      >
        Help
      </Button>
    </Tooltip>,
    <Button type="primary" icon={<PlusOutlined />}>
      Add Organization
    </Button>
  ]}
/>
```

### **Inline Help Tooltips**

```typescript
// On form fields
<Form.Item 
  label={
    <Space>
      Subdomain
      <Tooltip title="This will be your organization's URL: subdomain.ayphencare.com">
        <QuestionCircleOutlined style={{ color: '#1890ff' }} />
      </Tooltip>
    </Space>
  }
  name="subdomain"
>
  <Input placeholder="e.g., apollo-hospital" />
</Form.Item>
```

---

## 📝 **Sample Article Content (Full)**

### **Article: "How to Add a New Organization"**

```markdown
# How to Add a New Organization

**Last Updated**: February 26, 2026  
**Reading Time**: 5 minutes  
**Difficulty**: Beginner  
**Role**: Super Admin

---

## Overview

Adding a new organization to your Ayphen Care SaaS platform allows you to onboard hospitals, clinics, or healthcare facilities. Each organization gets:

- ✅ Isolated database and data
- ✅ Custom subdomain (e.g., `apollo.ayphencare.com`)
- ✅ Dedicated admin account
- ✅ Configurable subscription plan
- ✅ Independent user management

---

## Prerequisites

Before you begin, ensure you have:

- [x] **Super Admin access** to the platform
- [x] **Organization details** ready:
  - Hospital/clinic name
  - Primary admin email
  - Desired subdomain
  - Contact information
- [x] **Subscription plan** selected (Basic, Professional, or Enterprise)

---

## Step-by-Step Guide

### Step 1: Access Organizations Management

1. Log in to your Super Admin dashboard
2. Click on **SaaS Management** in the left sidebar
3. Select **Organizations** from the submenu

![Screenshot: Sidebar navigation](screenshot-1-sidebar.png)
*Navigate to SaaS Management → Organizations*

---

### Step 2: Initiate New Organization

On the Organizations page, you'll see a list of all existing organizations.

1. Click the **+ Add Organization** button in the top-right corner
2. A modal/form will appear

![Screenshot: Organizations list page](screenshot-2-org-list.png)
*Click the Add Organization button highlighted in the top right*

---

### Step 3: Fill Basic Information

Complete the **Basic Information** section:

#### Organization Name
- **Field**: `name`
- **Example**: "Apollo Hospitals Chennai"
- **Validation**: 3-100 characters, letters and spaces only
- **Required**: Yes

#### Subdomain
- **Field**: `subdomain`
- **Example**: "apollo-chennai"
- **Format**: Lowercase letters, numbers, hyphens only
- **Validation**: Must be unique across the platform
- **Result**: Creates URL: `apollo-chennai.ayphencare.com`
- **Required**: Yes

> 💡 **Tip**: Choose a short, memorable subdomain. It cannot be changed later without data migration.

#### Admin Email
- **Field**: `adminEmail`
- **Example**: "admin@apollochennai.com"
- **Purpose**: Primary contact and first admin account
- **Validation**: Valid email format
- **Required**: Yes

#### Phone Number
- **Field**: `phone`
- **Example**: "+91 98765 43210"
- **Format**: International format recommended
- **Required**: No

![Screenshot: Basic information form](screenshot-3-basic-info.png)
*Fill in organization name, subdomain, and admin email*

---

### Step 4: Configure Address & Location

Expand the **Address Details** section:

- **Street Address**: Physical location
- **City**: City name
- **State/Province**: State or province
- **Postal Code**: ZIP/PIN code
- **Country**: Select from dropdown

![Screenshot: Address form](screenshot-4-address.png)

---

### Step 5: Select Subscription Plan

Choose the appropriate subscription tier:

| Plan | Users | Storage | Price/Month | Best For |
|------|-------|---------|-------------|----------|
| **Basic** | 25 | 10 GB | ₹9,900 | Small clinics |
| **Professional** | 100 | 100 GB | ₹29,900 | Medium hospitals |
| **Enterprise** | 500 | 1 TB | ₹99,900 | Large hospital chains |

**Features Comparison**:

✅ **All Plans Include**:
- Patient management
- Appointment scheduling
- Medical records
- Basic reports
- Email support

✅ **Professional & Enterprise Add**:
- Pharmacy management
- Laboratory management
- Billing & invoicing
- Advanced analytics
- Multi-location support (Enterprise only)
- API access (Enterprise only)

![Screenshot: Plan selection](screenshot-5-plans.png)
*Select the subscription plan that fits the organization's needs*

---

### Step 6: Advanced Settings (Optional)

Click **Advanced Settings** to customize:

#### User Limits
- Override default user limit for the selected plan
- Example: Set to 50 users for a Professional plan

#### Storage Quota
- Override default storage limit
- Example: Allocate 200 GB instead of 100 GB

#### Feature Toggles
- Enable/disable specific modules:
  - [ ] Telemedicine
  - [ ] Physiotherapy
  - [ ] Diet Management
  - [ ] Emergency Management
  - [ ] Ambulance Tracking

#### Branding
- Upload custom logo
- Set primary color theme
- Custom email templates

![Screenshot: Advanced settings](screenshot-6-advanced.png)

---

### Step 7: Review and Create

1. Review all entered information
2. Check the **Terms & Conditions** checkbox
3. Click **Create Organization**

![Screenshot: Review screen](screenshot-7-review.png)

---

### Step 8: Confirmation

Upon successful creation:

✅ **Success Message**: "Organization created successfully!"

**What Happens Next**:
1. Organization record is created in the database
2. Subdomain is activated (may take 1-2 minutes)
3. Default roles are set up (Admin, Doctor, Nurse, etc.)
4. Welcome email is sent to the admin email address
5. Admin receives login credentials

![Screenshot: Success confirmation](screenshot-8-success.png)

---

## Post-Creation Steps

### For Super Admin:
1. Verify organization appears in the list
2. Check subscription status is "Active"
3. Monitor initial setup progress

### For Organization Admin:
1. Check email for welcome message
2. Click activation link
3. Set password for admin account
4. Log in to organization dashboard
5. Complete setup wizard:
   - Add departments
   - Add staff members
   - Configure settings

---

## Configuration Options Explained

### Subscription Plans

**Basic Plan** (₹9,900/month):
- Ideal for: Small clinics, single-location practices
- Users: Up to 25
- Storage: 10 GB
- Features: Core HMS features only

**Professional Plan** (₹29,900/month):
- Ideal for: Medium-sized hospitals
- Users: Up to 100
- Storage: 100 GB
- Features: All Basic + Pharmacy, Lab, Billing

**Enterprise Plan** (₹99,900/month):
- Ideal for: Large hospitals, multi-location chains
- Users: Up to 500
- Storage: 1 TB
- Features: All Professional + Multi-location, API, Custom integrations

### Billing Cycles
- **Monthly**: Pay month-to-month, cancel anytime
- **Yearly**: Save 20%, billed annually

---

## Troubleshooting

### Common Issues

#### ❌ Error: "Subdomain already exists"

**Cause**: Another organization is using this subdomain

**Solution**:
1. Try a different subdomain
2. Add location suffix (e.g., `apollo-chennai` instead of `apollo`)
3. Check existing organizations list for conflicts

---

#### ❌ Error: "Invalid email format"

**Cause**: Email address doesn't match required format

**Solution**:
1. Ensure email has format: `user@domain.com`
2. No spaces or special characters
3. Domain must have valid TLD (.com, .org, etc.)

---

#### ❌ Admin didn't receive welcome email

**Possible Causes**:
- Email in spam/junk folder
- Incorrect email address
- Email server delay

**Solutions**:
1. Check spam/junk folder
2. Verify email address in organization details
3. Click **Resend Welcome Email** button on Organizations page
4. Wait 5-10 minutes for delivery
5. Contact support if issue persists

---

#### ❌ Organization created but subdomain not working

**Cause**: DNS propagation delay

**Solution**:
- Wait 5-10 minutes for subdomain activation
- Clear browser cache
- Try incognito/private browsing mode
- If issue persists after 30 minutes, contact support

---

## Best Practices

### ✅ Subdomain Naming
- **DO**: Use organization name or abbreviation
  - `apollo-chennai`, `fortis-mumbai`, `aiims-delhi`
- **DON'T**: Use generic names
  - `hospital1`, `test`, `demo`

### ✅ Admin Email
- **DO**: Use organization's official email domain
  - `admin@apollochennai.com`
- **DON'T**: Use personal emails
  - `john.personal@gmail.com`

### ✅ Plan Selection
- Start with **Professional** for most hospitals
- Upgrade to **Enterprise** when:
  - Managing 3+ locations
  - Need API integrations
  - Require custom features

### ✅ Initial Setup
- Complete organization profile immediately
- Add at least one department
- Create admin user accounts
- Test login before notifying staff

---

## Video Tutorial

📹 **Watch: Adding a New Organization** (3:45)

[▶️ Play Video](https://youtube.com/watch?v=example)

**Topics Covered**:
- 0:00 - Introduction
- 0:30 - Navigating to Organizations
- 1:00 - Filling the form
- 2:00 - Selecting subscription plan
- 2:30 - Advanced settings
- 3:00 - Confirmation and next steps

---

## Related Articles

📚 **You might also be interested in**:

- [Managing Organization Subscriptions](link)
- [Editing Organization Details](link)
- [Suspending or Deleting Organizations](link)
- [Understanding Subscription Plans](link)
- [Multi-Location Setup Guide](link)
- [Organization Impersonation (Login As)](link)

---

## Frequently Asked Questions

**Q: Can I change the subdomain after creation?**  
A: No, subdomains are permanent. Contact support for data migration if needed.

**Q: How many organizations can I create?**  
A: Unlimited. Each organization is billed separately.

**Q: Can one user access multiple organizations?**  
A: Yes, users can have accounts in multiple organizations with different roles.

**Q: What happens if payment fails?**  
A: Organization is suspended after 7-day grace period. Data is retained for 30 days.

**Q: Can I offer custom pricing?**  
A: Yes, contact sales for custom Enterprise plans.

---

## Need More Help?

- 💬 **Live Chat**: Available 9 AM - 6 PM IST
- 📧 **Email Support**: support@ayphencare.com
- 📞 **Phone**: +91 80 1234 5678
- 🎫 **Submit Ticket**: [Support Portal](link)

---

**Was this article helpful?**

[👍 Yes (234)] [👎 No (12)]

*Last reviewed by: Admin Team on Feb 26, 2026*
```

---

## 🎯 **Implementation Checklist**

### **Phase 1: Backend (Week 1)**
- [ ] Create database migrations for all tables
- [ ] Implement API endpoints for categories
- [ ] Implement API endpoints for articles CRUD
- [ ] Implement screenshot upload & storage (AWS S3 or local)
- [ ] Add full-text search functionality
- [ ] Create seed data for sample articles

### **Phase 2: Admin CMS (Week 2)**
- [ ] Build category management UI
- [ ] Build article list/grid view
- [ ] Implement rich text editor (React-Quill or TipTap)
- [ ] Add screenshot upload component
- [ ] Create annotation tool for screenshots
- [ ] Add preview functionality
- [ ] Implement publish/draft workflow

### **Phase 3: Help Center Frontend (Week 3)**
- [ ] Build help center home page
- [ ] Create category browse pages
- [ ] Implement article view page
- [ ] Add search functionality with autocomplete
- [ ] Create breadcrumb navigation
- [ ] Add table of contents for articles
- [ ] Implement feedback system (helpful/not helpful)

### **Phase 4: Integration (Week 4)**
- [ ] Add contextual help buttons to all pages
- [ ] Create help widget/sidebar
- [ ] Implement analytics tracking
- [ ] Add user feedback collection
- [ ] Create admin analytics dashboard
- [ ] Test and refine

---

## 📊 **Success Metrics**

Track these KPIs to measure help center effectiveness:

1. **Usage Metrics**
   - Total article views
   - Unique visitors
   - Search queries
   - Time spent on articles

2. **Engagement Metrics**
   - Helpfulness rating (target: >85%)
   - Comments per article
   - Video completion rate
   - Bounce rate (target: <40%)

3. **Support Impact**
   - Reduction in support tickets
   - Self-service resolution rate
   - Time to resolution

4. **Content Quality**
   - Articles with <70% helpful rating (needs improvement)
   - Most searched but missing topics
   - Outdated articles (>6 months old)

---

## 🚀 **Next Steps**

1. **Review this POC document**
2. **Approve the approach**
3. **Prioritize features** (MVP vs. Nice-to-have)
4. **Allocate resources** (developers, content writers, designers)
5. **Set timeline** (2-4 weeks for MVP)
6. **Start implementation**

---

**Questions? Feedback?**

This POC demonstrates a comprehensive help center system. We can adjust scope, features, or timeline based on your requirements.

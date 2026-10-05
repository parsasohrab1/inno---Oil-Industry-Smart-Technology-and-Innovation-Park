# inno---Oil-Industry-Smart-Technology-and-Innovation-Park

> **Oil Technology Park Smart Industrial Dashboard (OIPMS)** — a complete implementation of the PCS architecture: dashboard frontend + real backend + role-based authentication + smart contract.

## Quick start (full stack)

Two terminals:

```bash
# Terminal 1 — backend (http://localhost:8787)  ← seeds the dataset on first run
cd server && npm install && cp .env.example .env && npm run dev

# Terminal 2 — frontend (http://localhost:5173)  ← connects to the backend through the Vite proxy
npm install && npm run dev
```

Then sign in with one of the sample accounts (the "Quick login" buttons on the login page):

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| Park manager | `admin@naftpark.ir` | `admin1234` | Everything + user management + park signature |
| Operator | `operator@naftpark.ir` | `operator1234` | Full dashboard, contracts, reports |
| Company manager | `company@naftpark.ir` | `company1234` | Billing/payment, booking, financing, contract signing |
| Startup | `startup@naftpark.ir` | `startup1234` | Similar to company + investment desk |
| Investor | `investor@naftpark.ir` | `investor1234` | Startup review, expressing interest, portfolio |
| Mentor | `mentor@naftpark.ir` | `mentor1234` | Mentees, session logging, progress updates |

### Tech stack

| Layer | Technology |
| :--- | :--- |
| Frontend | React 18 · TypeScript · Vite · Tailwind · Recharts · React Router · Zustand — Persian/RTL |
| Backend | Node ≥ 22.5 · Express · **`node:sqlite`** (no native dependencies) · JWT · bcrypt · Zod |
| Reporting | ExcelJS (xlsx) · CSV · printable HTML (PDF through the browser) |

API and roles details: [`server/README.md`](server/README.md) — architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

### Modules

**Operator/manager dashboard:** Overview · Digital twin · Companies · Fundraising · Domestic/international market ·
Mentoring · Judging and valuation · Finance · Traffic and security · Meeting booking · Events · Notifications · Smart contracts · Reporting · User management

**Role-based panels:** Company desk (bill payment, contract signing, booking, financing) · Investment desk · Mentoring desk

**Smart contract:** Two-party digital signature, an immutable event ledger with an SHA-256 hash chain and integrity verification,
automatic execution of conditions (late-payment penalty, gate blocking, renewal/expiry).

### No-backend mode

To run the frontend alone with a local synthetic dataset: `VITE_DATA_SOURCE=mock` (the role-based panel pages need the backend).
The Python version of the data generator is in [`data-generation/`](data-generation/).

---

# Comprehensive SRS Documentation of the Oil Smart Technology Park System


## 1. Product introduction

**Product name:** Oil Industry Park Management System (OIPMS - Oil Industry Park Management System)

**Brand name:** Naft Smart Park

**Overall goal:** Digital transformation of the Oil Industry Technology and Innovation Park and turning it into Iran's first specialized smart oil park, using international smartization standards such as WiredScore and SmartScore. This system is designed to increase productivity, reduce the workforce to a maximum of 3 people, and create a platform for developing the knowledge-based businesses located in the park.


## 2. International benchmark and reference standards

### 2-1. Global smartization standards

| **Standard/Certificate** | **Assessment area** | **Reference** |
| :--- | :--- | :--- |
| **WiredScore Platinum** | Digital connectivity quality, network capacity, system redundancy, cybersecurity and operational reliability |  |
| **SmartScore Platinum** | Integration maturity of smart systems, user experience, data governance transparency and sustained operational performance |  |
| **ISO 37122** | Smart city indicators and sustainable communities - smart technology and services |  |
| **ISO 19650** | Building Information Management (BIM) across the whole asset lifecycle |  |
| **APIGBA Award** | Smart green buildings in the Asia-Pacific region |  |

### 2-2. Benchmark from successful smart parks of the world

| **Smart park** | **Location** | **Notable features** | **Achievements** |
| :--- | :--- | :--- | :--- |
| **Tpark (Taipei Far Eastern Telecom Park)** | Taiwan | LOD 500 BIM, digital asset management system (DPMS), carbon management platform (T-Carbon), multi-path fiber optic connection with high redundancy and low-latency architecture | Asia's first smart park with the dual Platinum certificate of WiredScore and SmartScore |
| **Nankang Software Park** | Taiwan | Face recognition at the main entrance, license plate recognition (LPR), intrusion detection, video wall in the control center | Increased security and operational efficiency |
| **Smart Tianfu Software Park** | China | Digital twin and 3D modeling, smart operations center, data integration | Connecting the real and virtual worlds |
| **Fujisawa SST** | Japan | Sustainable infrastructure, smart energy management, clean transport | A model of sustainable towns |
| **Smart Kalasatama** | Finland | Smart mobility, clean energy, stakeholder participation | Reducing residents' daily travel time by 10 minutes |

**Key point:** 96% of urban park users cited the presence of smart technologies as the main factor increasing their willingness to use and invest.

### 2-3. Target position for the Oil Technology Park

With three strategic missions in the oil industry value chain, smartization and digital transformation, and consumption management, the Oil Technology Park can, by implementing this system, become known as the **first specialized smart oil park in the Middle East** and pave the way for obtaining international certificates.


## 3. High-Level Requirements

### 3-1. Strategic goals

| **Goal** | **Key performance indicator (KPI)** |
| :--- | :--- |
| Reduce operational workforce | At most 3 operators for the whole park |
| Increase operational productivity | 40% reduction in the time to carry out administrative processes |
| Financial transparency | Real-time display of the rent payment status of all companies |
| Attract capital for companies | 30% increase in the fundraising success rate through funds |
| Becoming knowledge-based companies | Providing an automatic path for 100% of companies to obtain knowledge-based status |
| Market development | Coverage of at least 5 domestic and 3 international target markets for each company |

### 3-2. Three-layer system architecture (PCS Architecture)

Based on the benchmark of leading smart parks, the system architecture is designed on the **Physical-Cyber-Social (PCS)** model:

1. **Physical Layer:** Sensors, smart cameras, automatic doors, plate readers, face recognition terminals, and IoT infrastructure
2. **Cyber Layer:** Cloud data processing, AI algorithms, digital twin, and management dashboards
3. **Social Layer:** User panels for companies, startups, investors and park operators


## 4. Functional Requirements

### 4-1. Access management and physical security module

#### 4-1-1. Smart attendance with face recognition

**Description:** An attendance system based on facial recognition technology at the park's main entrance.

**Features:**
- Face recognition of employees and visitors at the main entrance
- Automatic recording of entry and exit time
- Multi-factor identification (MFA) combining face recognition and smart card
- Connection to the notification system for unauthorized presence
- Automatic extraction of attendance reports for each company

**Required synthetic data:** At least 5,000 attendance records for 50 companies with an average of 20 employees

#### 4-1-2. Vehicle traffic control with a plate reader (LPR)

**Description:** An automatic license plate recognition system (License Plate Recognition) for managing vehicle entry and exit.

**Features:**
- Recognition of authorized vehicle plates and automatic recording of entry/exit time
- Integration with the rent payment system - **the gate does not open if the company is in arrears**
- Simultaneous recognition of plate and driver's face for dual identification
- Recording visitor vehicles and issuing a temporary permit
- Automatic notification to the operator upon entry of an unauthorized vehicle

**Required synthetic data:** At least 3,000 vehicle traffic records for 100 registered vehicles

### 4-2. Space and facilities management module

#### 4-2-1. Smart meeting room booking

**Description:** An online meeting room booking system with smart resource management.

**Features:**
- Booking of meeting rooms by resident companies through the user panel
- Real-time display of room status (free/busy)
- Automatic reminder sent to the booker
- Integration with IoT sensors to detect presence/absence in the room and release it automatically
- Ability to cancel and change bookings
- Smart prioritization based on company level and request type

**Required synthetic data:** At least 2,000 booking records for 20 meeting rooms over a 6-month period

#### 4-2-2. Shared spaces and events management

**Description:** The park's events calendar with registration and smart management.

**Features:**
- **Events calendar:** Display of all park events including Demo Day, Reverse Pitch, Pitch, workshops and conferences
- **Online registration** for participants
- **Reverse Pitch:** Ability for large companies to present oil industry challenges and for startups to provide solutions
- **Demo Day:** An event presenting the products and achievements of startups to investors
- Automatic notification to companies about related events

**Required synthetic data:** At least 100 events per year with an average of 50 participants per event

### 4-3. Financial and contract management module

#### 4-3-1. Smart rent payment control

**Description:** An integrated financial management system with the ability to connect to traffic control hardware.

**Features:**
- Automatic rent calculation based on area, rate and period
- Sending electronic invoices to companies
- **Connection to entrance gates:** If payment is not made on time, the vehicle entrance gate and employee face recognition are disabled
- **Smart Contract:** Automatic conclusion of a lease contract based on blockchain with automatic execution of conditions
- Displaying the payment status of all companies on the management dashboard
- Sending payment reminder notifications to companies and the operator

**Required synthetic data:** At least 1,000 invoices for 50 companies over a 12-month period with different payment, delay and penalty scenarios

#### 4-3-2. Smart Contract

**Description:** Implementation of blockchain-based smart contracts for transparency and security of contractual relations.

**Features:**
- Automatic recording of contract terms on the blockchain (immutable)
- Automatic execution of conditions (renewal, termination, penalty)
- Digital signature of the contract by the parties
- Display of the full contract history
- Integration with the payment and access control system

### 4-4. Startup and company support module

#### 4-4-1. Smart upload and judging of projects

**Description:** A system for intake and smart evaluation of ideas, projects and products of startups.

**Features:**
- Upload of a project/idea/product by applicant startups
- **Smart judging** based on three main axes:
  - **Market:** Market size, growth rate, competitors, export potential
  - **Innovative idea:** Degree of innovation, technology level, patent
  - **Team:** Members' background, skills, previous experience
- Automatic scoring with AI algorithms
- Providing the judging report to investors
- Prioritizing projects for fundraising

**Required synthetic data:** At least 200 projects with a varied distribution across different technology maturity levels

#### 4-4-2. Smart startup valuation

**Description:** An automatic valuation system for startup teams based on multiple criteria.

**Valuation criteria (in rials):**

| **Criterion** | **Weight** | **Indicators** |
| :--- | :--- | :--- |
| **Team** | 30% | Number and background of members, technical and managerial skills, previous experience in the oil industry |
| **Product** | 35% | Technology readiness level (TRL), degree of innovation, competitive advantage, intellectual property |
| **Market** | 35% | Target market size (TAM/SAM/SOM), growth rate, export potential, customer adoption |

**Valuation formula:**
```
Company value (rials) = (Team score × 30% + Product score × 35% + Market score × 35%) × Oil industry coefficient × Growth stage coefficient
```

**Output:** Proposed company value in rials, investment proposal, and growth roadmap

**Required synthetic data:** At least 100 startup teams with complete team, product and market data

#### 4-4-3. Smart company mentoring

**Description:** A system providing personalized growth paths and mentoring for each company.

**Mentoring areas:**

| **Area** | **Services** |
| :--- | :--- |
| **Business** | Business model development, market analysis, pricing, marketing |
| **Becoming knowledge-based** | Automatic assessment for obtaining knowledge-based status, preparing the file, tracking the steps |
| **Obtaining ISO** | Identifying suitable standards, implementation planning, certification consulting |
| **Production line setup** | Feasibility studies, equipment procurement, production planning |
| **Obtaining facilities** | Identifying financing sources, preparing the feasibility plan, introduction to funds |
| **Patent registration** | Patentability assessment, searching for similar patents, preparing the application |

**Features:**
- Automatic assessment of each company's needs based on existing data
- Providing a personalized growth path with a defined timeline
- Connection to the network of oil industry mentors
- Tracking the company's progress in each area
- Providing related educational content

**Required synthetic data:** At least 50 companies with a complete profile and needs assessment in all 6 areas

#### 4-4-4. Fundraising and connection to funds

**Description:** An integrated system for introducing companies to investment funds.

**Target funds:**
- Ministry of Petroleum Research and Technology Fund
- Domestic and foreign venture capital funds (Venture Capital)
- The **Innovation and Prosperity Fund** of the Presidency
- National Development Fund - oil sector
- Oil industry angel investors (Angel Investors)

**Features:**
- Automatic matching of companies with suitable funds based on field of activity, growth stage and financial need
- Automatic preparation of an Investment Package
- Holding virtual meetings with investors
- Tracking the status of financing requests
- Providing consulting to improve the chance of fundraising

**Required synthetic data:** At least 50 financing requests with complete specifications

### 4-5. Market development module

#### 4-5-1. Domestic market development

**Description:** A smart dashboard for analysis and development of the domestic market for each company.

**Features:**
- Automatic identification of potential domestic customers in the oil industry
- Competitor analysis and market share
- Demand forecasting in different sectors (refining, petrochemical, exploration and production)
- Providing market entry proposals
- Tracking tenders and commercial opportunities

#### 4-5-2. International market development

**Description:** A smart dashboard for analysis and development of international markets.

**Features:**
- Analysis of target markets (neighboring countries, Central Asia, Africa, Latin America)
- Identifying the technological needs of each market
- Analysis of tariffs and export regulations
- Introducing companies to international events
- Connection to technology attachés abroad

**Required synthetic data:** Market data of at least 15 target countries with market, growth, competition and tariff indicators

### 4-6. Management dashboard module

#### 4-6-1. General dashboard specifications

**Description:** An integrated management dashboard for park operators (at most 3 people).

**Appearance specifications:**
- **Language:** Entirely Persian
- **Title font:** "Welcome to the country's first smart park" in the **Taaliq** font at the top of the page
- **Sidebar:** On the right side of the page
- **Main tabs:**
  1. Fundraising
  2. Domestic market development
  3. International market development
  4. Mentoring (with sub-tabs: business, knowledge-based, obtaining ISO, production line setup, obtaining facilities, patent registration)

#### 4-6-2. Dashboard analytical capabilities

**Features:**
- **Digital Twin:** 3D display of the park with real-time data
- **Automatic extraction of the financial and operational balance** of resident companies
- **Smart forecasts** based on historical data
- **Automatic alerts** for critical events (non-payment, security violation, performance decline)
- **Advanced reporting** in various formats (PDF, Excel, JSON)
- **Display of key KPIs** in interactive charts
- **Comparative comparison** of company performance

#### 4-6-3. Smart notifications

**Description:** A smart notification system for all stakeholders.

**Notification recipients:**
- Resident companies and startups
- Park operators (at most 3 people)

**Notification types:**
- Rent payment reminder
- Announcement of park events (Demo Day, Reverse Pitch, Pitch)
- Security alerts (unauthorized entry, suspicious traffic)
- Notification of investment opportunities
- Mentoring session reminder
- Announcement of changes to laws and regulations
- Periodic performance reports


## 5. Data model and synthetic dataset

To ensure the quality of the dashboard output, synthetic datasets of sufficient volume and diversity are needed. Below is the synthetic data generation code in Python:

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from faker import Faker

fake = Faker('fa_IR')  # generate Persian data
np.random.seed(42)
random.seed(42)

# ============================================
# 1. Companies data (Companies)
# ============================================
def generate_companies(n=50):
    companies = []
    fields = ['Oil & Gas', 'Refining', 'Petrochemical', 'Renewable Energy',
              'Information Technology', 'Industrial Machinery', 'Management Consulting', 'Laboratory']
    for i in range(n):
        companies.append({
            'Company_ID': f'C{1000+i}',
            'Company_Name': fake.company(),
            'Establishment_Date': fake.date_between(start_date='-15y', end_date='-1y'),
            'Employee_Count': np.random.randint(5, 200),
            'Field_of_Activity': random.choice(fields),
            'Area_m2': np.random.randint(50, 2000),
            'Rental_Rate_per_m2': np.random.uniform(200000, 800000),
            'Maturity_Level': np.random.randint(1, 6),
            'Is_Knowledge_Based': np.random.choice([True, False], p=[0.4, 0.6]),
            'Has_Patent': np.random.choice([True, False], p=[0.3, 0.7]),
        })
    return pd.DataFrame(companies)

# ============================================
# 2. Attendance data (Attendance)
# ============================================
def generate_attendance(companies_df, n_days=180):
    records = []
    start_date = datetime.now() - timedelta(days=n_days)
    for _, company in companies_df.iterrows():
        emp_count = company['Employee_Count']
        for emp in range(min(emp_count, 30)):  # at most 30 employees for the sample
            for day in range(n_days):
                date = start_date + timedelta(days=day)
                if random.random() < 0.85:  # 85% attendance
                    check_in = f"{np.random.randint(7, 10):02d}:{np.random.randint(0, 60):02d}"
                    check_out = f"{np.random.randint(16, 19):02d}:{np.random.randint(0, 60):02d}"
                    records.append({
                        'User_ID': f'U{1000+emp}',
                        'Company_ID': company['Company_ID'],
                        'Date': date.strftime('%Y-%m-%d'),
                        'Check_in': check_in,
                        'Check_out': check_out,
                        'Access_Gate_ID': random.choice(['G1', 'G2', 'G3'])
                    })
    return pd.DataFrame(records)

# ============================================
# 3. Vehicle traffic data (Vehicle Logistics)
# ============================================
def generate_vehicle_logistics(companies_df, n_records=3000):
    records = []
    plates = [f'{random.randint(10,99)}{random.choice(["A","B","P","T","S"])}{random.randint(100,999)}'
              for _ in range(100)]
    for _ in range(n_records):
        company = companies_df.sample(1).iloc[0]
        records.append({
            'Equipment_ID': f'EQ{random.randint(1000,9999)}',
            'Company_Origin': company['Company_ID'],
            'Company_Dest': random.choice(companies_df['Company_ID'].tolist()),
            'Entry_Time': fake.date_time_between(start_date='-6M', end_date='now').strftime('%Y-%m-%d %H:%M:%S'),
            'Exit_Time': None,  # filled in at exit time
            'License_Plate': random.choice(plates),
            'RFID_Tag': f'RF{random.randint(10000,99999)}',
            'Status': random.choice(['Inbound', 'Outbound', 'Pending'])
        })
    return pd.DataFrame(records)

# ============================================
# 4. Rent payment data (Rental Payments)
# ============================================
def generate_rental_payments(companies_df, n_months=12):
    records = []
    start_date = datetime.now() - timedelta(days=n_months*30)
    for _, company in companies_df.iterrows():
        for month in range(n_months):
            date = start_date + timedelta(days=month*30)
            total_rent = company['Area_m2'] * company['Rental_Rate_per_m2']
            is_paid = random.random() < 0.75  # 75% on-time payment
            records.append({
                'Tenant_ID': company['Company_ID'],
                'Company_Name': company['Company_Name'],
                'Area_m2': company['Area_m2'],
                'Rental_Rate_per_m2': company['Rental_Rate_per_m2'],
                'Total_Rent': int(total_rent),
                'Payment_Date': (date + timedelta(days=random.randint(-5, 20))).strftime('%Y-%m-%d') if is_paid else None,
                'Due_Date': (date + timedelta(days=30)).strftime('%Y-%m-%d'),
                'Status': random.choices(['Paid', 'Overdue', 'Pending'], weights=[0.6, 0.2, 0.2])[0],
                'Months_Overdue': np.random.randint(0, 3) if not is_paid else 0
            })
    return pd.DataFrame(records)

# ============================================
# 5. Meeting room booking data (Meeting Room Booking)
# ============================================
def generate_meeting_bookings(companies_df, n=2000):
    rooms = ['Aramgah', 'Ferdowsi', 'Saadi', 'Hafez', 'Molavi', 'Khayyam', 'Baba Taher', 'Ouhadi',
             'Nezami', 'Attar', 'Sanai', 'Jami', 'Shabestari', 'Saeb', 'Vahshi', 'Naser Khosrow']
    records = []
    for _ in range(n):
        company = companies_df.sample(1).iloc[0]
        start = fake.date_time_between(start_date='-6M', end_date='+3M')
        duration = random.choice([30, 60, 90, 120, 180])
        records.append({
            'Booking_ID': f'B{random.randint(10000,99999)}',
            'Company_ID': company['Company_ID'],
            'Room_Name': random.choice(rooms),
            'Start_Time': start.strftime('%Y-%m-%d %H:%M:%S'),
            'End_Time': (start + timedelta(minutes=duration)).strftime('%Y-%m-%d %H:%M:%S'),
            'Duration_Minutes': duration,
            'Participant_Count': np.random.randint(2, 20),
            'Status': random.choices(['Confirmed', 'Cancelled', 'Completed'], weights=[0.7, 0.1, 0.2])[0],
            'Is_Virtual': np.random.choice([True, False], p=[0.2, 0.8])
        })
    return pd.DataFrame(records)

# ============================================
# 6. Startup and judging data (Startup Evaluations)
# ============================================
def generate_startup_evaluations(n=200):
    records = []
    for i in range(n):
        team_score = np.random.uniform(40, 95)
        market_score = np.random.uniform(30, 90)
        product_score = np.random.uniform(35, 92)
        ai_final_score = (team_score * 0.3 + market_score * 0.35 + product_score * 0.35)
        
        # valuation in rials
        base_valuation = ai_final_score * 100_000_000  # base
        industry_multiplier = np.random.uniform(0.8, 2.5)  # oil industry coefficient
        stage_multiplier = np.random.uniform(0.5, 3.0)  # growth stage coefficient
        
        valuation_rial = int(base_valuation * industry_multiplier * stage_multiplier)
        
        records.append({
            'Team_ID': f'T{1000+i}',
            'Team_Name': f'Team {fake.company_suffix()}',
            'Idea_Title': fake.catch_phrase(),
            'Team_Score': round(team_score, 2),
            'Market_Score': round(market_score, 2),
            'Product_Score': round(product_score, 2),
            'AI_Final_Score': round(ai_final_score, 2),
            'Valuation_Rial': valuation_rial,
            'Valuation_USD': int(valuation_rial / 50000),  # approximately
            'Investment_Recommendation': ai_final_score > 70,
            'Suggested_Investment_Rial': int(valuation_rial * np.random.uniform(0.1, 0.4)),
            'TRL_Level': np.random.randint(3, 9),
            'Patent_Status': random.choice(['Registered', 'Pending registration', 'None', 'Under review'])
        })
    return pd.DataFrame(records)

# ============================================
# 7. International market data (Market Intelligence)
# ============================================
def generate_market_intelligence():
    countries = ['Turkey', 'UAE', 'Saudi Arabia', 'Qatar', 'Oman', 'Iraq', 'Afghanistan',
                 'Pakistan', 'India', 'China', 'Russia', 'Kazakhstan', 'Turkmenistan', 'Azerbaijan',
                 'Venezuela', 'Nigeria', 'Angola', 'Malaysia', 'Indonesia']
    records = []
    for country in countries:
        records.append({
            'Country': country,
            'Market_Size_USD': np.random.uniform(100_000_000, 50_000_000_000),
            'Growth_Rate': np.random.uniform(-5, 25),
            'Competitor_Count': np.random.randint(1, 50),
            'Tariff_Rate': np.random.uniform(0, 30),
            'Ease_of_Doing_Business': np.random.randint(1, 100),
            'Oil_Gas_Sector_Share': np.random.uniform(10, 90),
            'Tech_Readiness': np.random.randint(1, 100),
            'Political_Stability': np.random.randint(1, 100)
        })
    return pd.DataFrame(records)

# ============================================
# 8. Mentoring data (Mentoring)
# ============================================
def generate_mentoring_data(companies_df):
    areas = ['Business', 'Knowledge-based', 'Obtaining ISO', 'Production line setup', 'Obtaining facilities', 'Patent registration']
    records = []
    for _, company in companies_df.iterrows():
        for area in random.sample(areas, np.random.randint(2, 5)):
            records.append({
                'Company_ID': company['Company_ID'],
                'Company_Name': company['Company_Name'],
                'Mentoring_Area': area,
                'Start_Date': fake.date_between(start_date='-1y', end_date='now').strftime('%Y-%m-%d'),
                'Status': random.choices(['In progress', 'Completed', 'Planned', 'Suspended'], weights=[0.4, 0.3, 0.2, 0.1])[0],
                'Progress_Percent': np.random.randint(0, 100),
                'Mentor_Name': fake.name(),
                'Next_Session': fake.date_between(start_date='now', end_date='+3M').strftime('%Y-%m-%d')
            })
    return pd.DataFrame(records)

# ============================================
# 9. Events data (Events)
# ============================================
def generate_events(n=100):
    event_types = ['Demo Day', 'Reverse Pitch', 'Pitch', 'Training workshop', 'Conference', 'Innovation competition', 'Networking']
    records = []
    for _ in range(n):
        start = fake.date_time_between(start_date='-6M', end_date='+6M')
        records.append({
            'Event_ID': f'E{random.randint(1000,9999)}',
            'Event_Title': fake.catch_phrase(),
            'Event_Type': random.choice(event_types),
            'Start_Date': start.strftime('%Y-%m-%d %H:%M:%S'),
            'End_Date': (start + timedelta(hours=random.randint(2, 8))).strftime('%Y-%m-%d %H:%M:%S'),
            'Location': random.choice(['Conference hall', 'Main meeting room', 'Open space', 'Hall No. 2', 'Pavilion']),
            'Max_Participants': np.random.randint(20, 500),
            'Registered_Count': np.random.randint(0, 400),
            'Status': random.choices(['Held', 'In progress', 'Planned', 'Cancelled'], weights=[0.3, 0.1, 0.5, 0.1])[0]
        })
    return pd.DataFrame(records)

# ============================================
# 10. Balance sheet data (Balance Sheet)
# ============================================
def generate_balance_sheets(companies_df, n_periods=4):
    records = []
    for _, company in companies_df.iterrows():
        for period in range(n_periods):
            revenue = np.random.uniform(100_000_000, 50_000_000_000)
            costs = revenue * np.random.uniform(0.3, 0.85)
            records.append({
                'Company_ID': company['Company_ID'],
                'Company_Name': company['Company_Name'],
                'Period': f'Q{period+1} 2026',
                'Revenue': int(revenue),
                'Costs': int(costs),
                'Net_Profit': int(revenue - costs),
                'Assets': int(np.random.uniform(200_000_000, 100_000_000_000)),
                'Liabilities': int(np.random.uniform(0, 50_000_000_000)),
                'Employee_Growth': np.random.uniform(-10, 30)
            })
    return pd.DataFrame(records)

# ============================================
# Run and save
# ============================================
if __name__ == "__main__":
    print("🔄 Generating synthetic data for the oil smart park...")
    
    companies_df = generate_companies(50)
    print(f"✅ Companies: {len(companies_df)} records")
    
    attendance_df = generate_attendance(companies_df, 180)
    print(f"✅ Attendance: {len(attendance_df)} records")
    
    vehicle_df = generate_vehicle_logistics(companies_df, 3000)
    print(f"✅ Vehicle traffic: {len(vehicle_df)} records")
    
    rental_df = generate_rental_payments(companies_df, 12)
    print(f"✅ Rent payments: {len(rental_df)} records")
    
    booking_df = generate_meeting_bookings(companies_df, 2000)
    print(f"✅ Meeting bookings: {len(booking_df)} records")
    
    startup_df = generate_startup_evaluations(200)
    print(f"✅ Startup evaluations: {len(startup_df)} records")
    
    market_df = generate_market_intelligence()
    print(f"✅ Market data: {len(market_df)} records")
    
    mentoring_df = generate_mentoring_data(companies_df)
    print(f"✅ Mentoring: {len(mentoring_df)} records")
    
    events_df = generate_events(100)
    print(f"✅ Events: {len(events_df)} records")
    
    balance_df = generate_balance_sheets(companies_df, 4)
    print(f"✅ Balance sheet: {len(balance_df)} records")
    
    # Save to CSV files
    companies_df.to_csv('companies.csv', index=False)
    attendance_df.to_csv('attendance.csv', index=False)
    vehicle_df.to_csv('vehicle_logistics.csv', index=False)
    rental_df.to_csv('rental_payments.csv', index=False)
    booking_df.to_csv('meeting_bookings.csv', index=False)
    startup_df.to_csv('startup_evaluations.csv', index=False)
    market_df.to_csv('market_intelligence.csv', index=False)
    mentoring_df.to_csv('mentoring.csv', index=False)
    events_df.to_csv('events.csv', index=False)
    balance_df.to_csv('balance_sheets.csv', index=False)
    
    print("\n✅ All data was successfully generated and saved!")
    print(f"📊 Total records: {sum([len(df) for df in [companies_df, attendance_df, vehicle_df, rental_df, booking_df, startup_df, market_df, mentoring_df, events_df, balance_df]])}")
```


## 6. Non-Functional Requirements

| **Requirement** | **Specifications** |
| :--- | :--- |
| **Availability** | 99.9% during working hours |
| **Response time** | At most 2 seconds for displaying the dashboard |
| **Security** | Data encryption, two-factor authentication, recording all transactions |
| **Scalability** | Ability to support at least 200 companies and 5,000 users |
| **Reliability** | Daily backup, recovery in less than 1 hour |
| **Maintainability** | Complete documentation, modular architecture, high testability |
| **Integration** | Ability to connect to the Ministry of Petroleum's existing systems |
| **Standards compliance** | Alignment with ISO 37122 smart city indicators |


## 7. Constraints

1. **Workforce:** At most 3 operators for the whole system
2. **Costs:** The cost of purchasing equipment and sensors is borne by the park; software implementation is free
3. **Language:** All user interfaces in Persian
4. **Infrastructure:** Requires a fiber optic connection with a bandwidth of at least 1 gigabit per second
5. **Security:** Full compliance with the Ministry of Petroleum's security requirements and protection of industrial data


## 8. User Roles

| **Role** | **Access** |
| :--- | :--- |
| **Park manager** | Full access to all dashboard sections, final approval of contracts, user management |
| **Park operator (3 people)** | Access to the management dashboard, notification management, reporting, exception handling |
| **Company manager** | Access to the company panel, viewing invoices, booking meetings, uploading projects, tracking mentoring |
| **Startup** | Access to project upload, viewing judging results, requesting mentoring, searching for investors |
| **Investor** | Access to company and startup profiles, viewing evaluations, expressing interest |
| **Consultant/Mentor** | Access to the mentoring panel, viewing covered companies, recording sessions and progress |


## 9. Implementation Roadmap

| **Phase** | **Duration** | **Activities** |
| :--- | :--- | :--- |
| **Phase 1: Studies and design** | 2 months | Developing the architecture, approving scenarios, selecting equipment, UI/UX design |
| **Phase 2: Physical infrastructure** | 3 months | Installing sensors, cameras, plate readers, automatic doors, fiber optic network |
| **Phase 3: Software implementation** | 4 months | Developing modules, implementing AI algorithms, integration |
| **Phase 4: Testing and validation** | 1 month | Performance test, security test, validation with synthetic data |
| **Phase 5: Deployment and commissioning** | 1 month | Installation in the production environment, operator training, official launch |

**Total implementation time:** 11 months


## 10. Conclusion

The Oil Industry Park Management System (OIPMS), leveraging international standards such as WiredScore, SmartScore and ISO 37122, and modeling successful parks of the world such as Tpark (Taiwan) and Nankang Software Park, provides a comprehensive platform for the smartization of the Oil Technology Park. By covering all operational, financial, security, business support and market development dimensions, while reducing the workforce to at most 3 people, this system will lay the groundwork for achieving the park's strategic goals in smartization and the digital transformation of the oil industry.

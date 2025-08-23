# 🔥 ClinicalScribe Demo Data Seeding

## Quick Start

1. **Configure Firebase**: Ensure your `.env.local` has proper Firebase credentials
2. **Run Seeding**: `npx tsx scripts/seed-demo.ts`
3. **Verify Data**: Check Dashboard and SOAP History pages

## What Gets Created

### 📊 Demo Data
- **5 Realistic Patients** with demographics, MRNs, insurance
- **15 SOAP Notes** (3 per patient) with clinical scenarios
- **Digital Signatures** for all notes  
- **PDF Metadata** ready for download buttons

### 🎯 Clinical Scenarios
- Chest pain / Cardiac workup
- Community-acquired pneumonia
- Tension headache / Migraine
- Diabetes follow-up
- Mechanical low back pain

### 💼 Professional Metadata
- Real doctor names and signatures
- Encounter types (ED, Urgent Care, Primary Care)
- Pain levels and red flags
- FHIR export status simulation

## CIO Demo Flow

1. **Dashboard** → See patient statistics  
2. **SOAP History** → Filter by "📄 PDF Available"
3. **Patient Search** → Debounced search experience
4. **Download PDFs** → Signed URL security
5. **Paywall** → Upgrade flow for non-beta users

## Firebase Collections

```
patients/
├── {id}
│   ├── name: "John Smith"
│   ├── mrn: "MRN1234567"
│   ├── dob: Date
│   └── insurance: {...}

soapNotes/
├── {id}
│   ├── patientId: ref
│   ├── subjective: "Patient reports..."
│   ├── objective: "Vital signs..."
│   ├── assessment: "Clinical diagnosis..."
│   ├── plan: "Treatment recommendations..."
│   ├── digitalSignature: SVG signature
│   ├── storagePath: "pdfs/demo/..."
│   └── pdf: { status: "generated" }
```

## 🚀 Production Notes

- Seeding script clears existing demo data first
- All patients get realistic demographics
- SOAP notes use medical terminology
- PDFs are marked as generated (storage paths ready)
- Ready for immediate CIO demonstration

**Time to Seed**: ~30 seconds  
**Demo Ready**: Instant professional clinical environment
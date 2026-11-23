import type { Language, ListingType } from '../types/sheba';

export interface SpecFieldOption {
  value: string;
  labelBn: string;
  labelEn: string;
}

export interface DynamicSpecField {
  key: string;
  labelBn: string;
  labelEn: string;
  type: 'select' | 'text';
  placeholderBn?: string;
  placeholderEn?: string;
  options?: SpecFieldOption[];
}

export interface CategorySpecConfig {
  fields: DynamicSpecField[];
  featuresLabelBn: string;
  featuresLabelEn: string;
  features: SpecFieldOption[];
}

const TUTOR_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'tutorLevel',
      labelBn: 'ক্লাস / লেভেল',
      labelEn: 'Class / Level',
      type: 'select',
      options: [
        { value: 'Play – Class 5', labelBn: 'প্লে – ৫ম শ্রেণি', labelEn: 'Play – Class 5' },
        { value: 'Class 6 – 8', labelBn: '৬ষ্ঠ – ৮ম শ্রেণি', labelEn: 'Class 6 – 8' },
        { value: 'SSC / Class 9-10', labelBn: 'এসএসসি (৯ম–১০ম)', labelEn: 'SSC / Class 9–10' },
        { value: 'HSC / College', labelBn: 'এইচএসসি / কলেজ', labelEn: 'HSC / College' },
        { value: 'Admission / University', labelBn: 'বিশ্ববিদ্যালয় / মেডিকেল / ইঞ্জিনিয়ারিং ভর্তি', labelEn: 'Admission / University' },
        { value: 'IELTS / Spoken English', labelBn: 'আইইএলটিএস / স্পোকেন ইংলিশ', labelEn: 'IELTS / Spoken English' },
        { value: 'Quran / Arabic', labelBn: 'কোরআন শিক্ষা / আরবি', labelEn: 'Quran / Arabic' },
        { value: 'Coding / Freelancing', labelBn: 'কম্পিউটার / প্রোগ্রামিং / ফ্রিল্যান্সিং', labelEn: 'Coding / IT Skills' },
      ],
    },
    {
      key: 'tutorMedium',
      labelBn: 'মাধ্যম (Medium)',
      labelEn: 'Medium',
      type: 'select',
      options: [
        { value: 'Bangla Medium', labelBn: 'বাংলা মাধ্যম', labelEn: 'Bangla Medium' },
        { value: 'English Version', labelBn: 'ইংলিশ ভার্সন', labelEn: 'English Version' },
        { value: 'English Medium (O/A Level)', labelBn: 'ইংলিশ মিডিয়াম (O/A Level)', labelEn: 'English Medium (O/A Level)' },
        { value: 'Madrasa / Arbi', labelBn: 'মাদ্রাসা / আলিয়া / কওমি', labelEn: 'Madrasa / Arabic' },
        { value: 'All Mediums', labelBn: 'সকল মাধ্যম', labelEn: 'All Mediums' },
      ],
    },
    {
      key: 'tutorSchedule',
      labelBn: 'পড়ানোর দিন / সপ্তাহে কতদিন',
      labelEn: 'Days / Week',
      type: 'select',
      options: [
        { value: '3 Days/Week', labelBn: 'সপ্তাহে ৩ দিন', labelEn: '3 Days / Week' },
        { value: '4 Days/Week', labelBn: 'সপ্তাহে ৪ দিন', labelEn: '4 Days / Week' },
        { value: '5 Days/Week', labelBn: 'সপ্তাহে ৫ দিন', labelEn: '5 Days / Week' },
        { value: '6 Days/Week', labelBn: 'সপ্তাহে ৬ দিন', labelEn: '6 Days / Week' },
        { value: 'Weekend / Flexible', labelBn: 'সাপ্তাহিক ছুটি / সুবিধামতো', labelEn: 'Weekend / Flexible' },
      ],
    },
    {
      key: 'tutorQualification',
      labelBn: 'শিক্ষকের শিক্ষাগত যোগ্যতা / প্রতিষ্ঠান',
      labelEn: 'Tutor Qualification / University',
      type: 'select',
      options: [
        { value: 'Public University (DU/BUET/Medical)', labelBn: 'পাবলিক বিশ্ববিদ্যালয় (ঢাবি/বুয়েট/মেডিকেল)', labelEn: 'Public University (DU/BUET/Medical)' },
        { value: 'Private University Graduate/Student', labelBn: 'প্রাইভেট বিশ্ববিদ্যালয়', labelEn: 'Private University' },
        { value: 'National University / Masters', labelBn: 'জাতীয় বিশ্ববিদ্যালয় / মাস্টার্স', labelEn: 'National University / Masters' },
        { value: 'Experienced School/College Teacher', labelBn: 'অভিজ্ঞ স্কুল/কলেজ শিক্ষক', labelEn: 'School/College Teacher' },
      ],
    },
    {
      key: 'tutorSubjects',
      labelBn: 'কোন কোন বিষয় পড়ান',
      labelEn: 'Subjects Taught',
      type: 'text',
      placeholderBn: 'যেমন: গণিত, পদার্থবিজ্ঞান, রসায়ন, ইংরেজি, আইসিটি',
      placeholderEn: 'e.g., Math, Physics, Chemistry, English, ICT',
    },
  ],
  featuresLabelBn: 'টিউশনির ধরন ও বিশেষ সুবিধা (সিলেক্ট করুন বা নিজের মতো লিখুন)',
  featuresLabelEn: 'Tuition Modes & Highlights (Select or add custom)',
  features: [
    { value: 'Home Visit (Basay Giye)', labelBn: 'বাসায় গিয়ে পড়ানো', labelEn: 'Home Visit' },
    { value: 'Online Class (Zoom/Meet)', labelBn: 'অনলাইন ক্লাস (Zoom/Meet)', labelEn: 'Online Class' },
    { value: 'Batch Coaching', labelBn: 'ব্যাচ / কোচিং', labelEn: 'Batch Tuition' },
    { value: 'Free Trial Class', labelBn: 'ফ্রি ১–২ দিন ডেমো ক্লাস', labelEn: 'Free Trial Class' },
    { value: 'Weekly Exam & Hand Notes', labelBn: 'সাপ্তাহিক পরীক্ষা ও হ্যান্ডনোট', labelEn: 'Weekly Tests & Notes' },
    { value: 'Female Tutor Available', labelBn: 'মহিলা শিক্ষক সুবিধা', labelEn: 'Female Tutor' },
    { value: 'Male Tutor', labelBn: 'পুরুষ শিক্ষক', labelEn: 'Male Tutor' },
  ],
};

const ELECTRICIAN_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'workType',
      labelBn: 'প্রধান ইলেকট্রিক কাজের ধরন',
      labelEn: 'Primary Electrical Work',
      type: 'select',
      options: [
        { value: 'Full House Wiring', labelBn: 'নতুন বাসা / বিল্ডিং ওয়্যারিং', labelEn: 'Full House Wiring' },
        { value: 'IPS / Inverter / Solar Setup', labelBn: 'আইপিএস / ইনভার্টার / সোলার সেটআপ', labelEn: 'IPS / Inverter / Solar' },
        { value: 'Short Circuit & DB Board', labelBn: 'শর্ট-সার্কিট ও এমসিবি/ডিবি বোর্ড', labelEn: 'Short Circuit & Breaker Panel' },
        { value: 'Fan, Light, Geyser & AC Point', labelBn: 'ফ্যান, লাইট, গিজার ও এসি লাইন', labelEn: 'Fan, Light, Geyser & AC Point' },
        { value: 'Water Motor / Submersible Connection', labelBn: 'পানির মোটর ও অটো-সুইচ কানেকশন', labelEn: 'Water Motor & Auto Switch' },
      ],
    },
    {
      key: 'phaseSupport',
      labelBn: 'লাইন ও সাপ্লাই সাপোর্ট',
      labelEn: 'Power Line Support',
      type: 'select',
      options: [
        { value: 'Single Phase (220V Home)', labelBn: 'সিঙ্গেল ফেজ (বাসা-বাড়ি)', labelEn: 'Single Phase (Home)' },
        { value: 'Three Phase (Commercial/Factory)', labelBn: 'থ্রি-ফেজ (অফিস ও কারখানা)', labelEn: 'Three Phase (Commercial)' },
        { value: 'Both Single & 3-Phase', labelBn: 'সিঙ্গেল ও থ্রি-ফেজ উভয়ই', labelEn: 'Both Single & 3-Phase' },
      ],
    },
    {
      key: 'availability',
      labelBn: 'কাজের সময়সূচি',
      labelEn: 'Working Hours',
      type: 'select',
      options: [
        { value: '24/7 Emergency Call', labelBn: '২৪ ঘণ্টা ইমার্জেন্সি সার্ভিস', labelEn: '24/7 Emergency' },
        { value: 'Morning – Night (8AM–10PM)', labelBn: 'সকাল ৮টা – রাত ১০টা', labelEn: '8AM – 10PM' },
        { value: 'By Appointment', labelBn: 'আগে থেকে সময় ঠিক করে', labelEn: 'By Appointment' },
      ],
    },
  ],
  featuresLabelBn: 'ইলেকট্রিশিয়ান সেবার বৈশিষ্ট্য',
  featuresLabelEn: 'Electrical Service Features',
  features: [
    { value: '30-Min Emergency Arrival', labelBn: 'জরুরি সময়ে দ্রুত উপস্থিতি', labelEn: 'Fast Emergency Visit' },
    { value: 'Own Digital Meter & Tools', labelBn: 'আধুনিক মিটার ও নিজস্ব যন্ত্রপাতি', labelEn: 'Digital Tester & Tools' },
    { value: 'Concealed & Surface Wiring', labelBn: 'কনসিল ও সারফেস ওয়্যারিং', labelEn: 'Concealed & Surface Wiring' },
    { value: '7-Day Work Guarantee', labelBn: 'কাজের পর সার্ভিস গ্যারান্টি', labelEn: 'Service Warranty' },
    { value: 'Contract & Daily Basis', labelBn: 'চুক্তিভিত্তিক ও পয়েন্ট হিসাব', labelEn: 'Contract / Per-Point Rate' },
  ],
};

const AC_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'acWork',
      labelBn: 'এসি কাজের ধরন',
      labelEn: 'AC Service Type',
      type: 'select',
      options: [
        { value: 'Master Servicing & Jet Wash', labelBn: 'মাস্টার সার্ভিসিং ও জেট ওয়াশ', labelEn: 'Master Servicing & Jet Wash' },
        { value: 'Gas Refill (R22/R32/R410a)', labelBn: 'গ্যাস রিফিল (R22 / R32 / R410a)', labelEn: 'Gas Refill' },
        { value: 'AC Installation / Shifting', labelBn: 'নতুন এসি ইনস্টলেশন / বাসা শিফটিং', labelEn: 'Installation / Shifting' },
        { value: 'Cooling Problem & PCB Repair', labelBn: 'কুলিং সমস্যা ও পিসিবি বোর্ড মেরামত', labelEn: 'Cooling & PCB Repair' },
      ],
    },
    {
      key: 'acType',
      labelBn: 'কোন ধরনের এসি কাজ করেন',
      labelEn: 'Supported AC Types',
      type: 'select',
      options: [
        { value: 'Split & Inverter AC', labelBn: 'স্প্লিট ও ইনভার্টার এসি', labelEn: 'Split & Inverter AC' },
        { value: 'Window & Cassette AC', labelBn: 'উইন্ডো ও ক্যাসেট এসি', labelEn: 'Window & Cassette AC' },
        { value: 'VRF / Chiller / Central AC', labelBn: 'VRF ও সেন্ট্রাল এসি', labelEn: 'VRF / Central AC' },
        { value: 'All Types of AC', labelBn: 'সব ধরনের এসি', labelEn: 'All Types of AC' },
      ],
    },
    {
      key: 'brandSkill',
      labelBn: 'ব্র্যান্ড অভিজ্ঞতা',
      labelEn: 'Brand Expertise',
      type: 'text',
      placeholderBn: 'যেমন: Gree, General, Daikin, Walton, Samsung, LG',
      placeholderEn: 'e.g., Gree, General, Daikin, Walton, Samsung',
    },
  ],
  featuresLabelBn: 'এসি সার্ভিস সুবিধা',
  featuresLabelEn: 'AC Service Features',
  features: [
    { value: 'Foam Jet Wash Machine', labelBn: 'ফোম ও হাই-প্রেশার জেট ওয়াশ', labelEn: 'Foam Jet Wash' },
    { value: 'Original Gas & Copper Pipe', labelBn: 'অরিজিনাল গ্যাস ও কপার পাইপ', labelEn: 'Original Gas & Copper' },
    { value: 'Leakage Vacuum Test', labelBn: 'নাইট্রোজেন লিক ও ভ্যাকুয়াম টেস্ট', labelEn: 'Leakage & Vacuum Test' },
    { value: '30-Day Service Warranty', labelBn: '৩০ দিনের সার্ভিস ওয়ারেন্টি', labelEn: '30-Day Warranty' },
    { value: 'Same-Day Home Visit', labelBn: 'একই দিনে হোম ভিজিট', labelEn: 'Same-Day Visit' },
  ],
};

const PLUMBER_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'plumbingWork',
      labelBn: 'কাজের ধরন',
      labelEn: 'Plumbing Work Type',
      type: 'select',
      options: [
        { value: 'Bathroom & Kitchen Fittings', labelBn: 'বাথরুম ও কিচেন স্যানিটারি ফিটিংস', labelEn: 'Bathroom & Kitchen Fittings' },
        { value: 'Pipe Leakage & Concealed Repair', labelBn: 'পাইপ লিকেজ ও ড্যাম্প মেরামত', labelEn: 'Pipe Leakage Repair' },
        { value: 'Water Motor & Tank Setup', labelBn: 'পানির মোটর, ট্যাংক ও পাইপলাইন', labelEn: 'Water Motor & Tank' },
        { value: 'Commode, Basin & Geyser', labelBn: 'কমোড, বেসিন, শাওয়ার ও গিজার', labelEn: 'Commode, Basin & Geyser' },
      ],
    },
    {
      key: 'pipeSkill',
      labelBn: 'পাইপলাইন দক্ষতা',
      labelEn: 'Pipe Material Skill',
      type: 'select',
      options: [
        { value: 'PPR / UPVC / CPVC Fusion', labelBn: 'PPR / uPVC / CPVC হিট ফিউশন', labelEn: 'PPR / uPVC / CPVC' },
        { value: 'GI & Steel Pipeline', labelBn: 'জিআই ও মেটাল পাইপ', labelEn: 'GI / Metal Pipe' },
        { value: 'All Plumbing Materials', labelBn: 'সব ধরনের স্যানিটারি পাইপ', labelEn: 'All Materials' },
      ],
    },
  ],
  featuresLabelBn: 'প্লাম্বিং সুবিধা',
  featuresLabelEn: 'Plumbing Highlights',
  features: [
    { value: 'Emergency Leak Fix', labelBn: 'জরুরি লিকেজ বন্ধ', labelEn: 'Emergency Leak Fix' },
    { value: 'PPR Welding Machine', labelBn: 'নিজস্ব PPR হিট মেশিন', labelEn: 'Own PPR Welding Machine' },
    { value: 'Water Tank Cleaning', labelBn: 'পানির ট্যাংক পরিষ্কার', labelEn: 'Tank Cleaning' },
    { value: 'Free Inspection', labelBn: 'ফ্রি সাইট পরিদর্শন', labelEn: 'Free Inspection' },
  ],
};

const PAINTER_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'paintWork',
      labelBn: 'রং কাজের ধরন',
      labelEn: 'Painting Type',
      type: 'select',
      options: [
        { value: 'Interior Plastic & Luxury Silk', labelBn: 'ইন্টেরিয়র প্লাস্টিক / লাক্সারি সিল্ক', labelEn: 'Interior Plastic / Silk' },
        { value: 'Exterior Weather Coat', labelBn: 'এক্সটেরিয়র ওয়েদার কোট', labelEn: 'Exterior Weather Coat' },
        { value: 'Damp Wall Treatment & Putty', labelBn: 'নোনা/ড্যাম্প প্রুফিং ও ওয়াল পুটি', labelEn: 'Damp Proof & Wall Putty' },
        { value: 'Wood Polish / Enamel Grill', labelBn: 'দরজা বার্নিশ ও গ্রিল এনামেল', labelEn: 'Wood Polish & Grill Enamel' },
      ],
    },
    {
      key: 'rateModel',
      labelBn: 'মজুরির ধরন',
      labelEn: 'Pricing Basis',
      type: 'select',
      options: [
        { value: 'With Materials Package', labelBn: 'রং ও মালামালসহ প্যাকেজ', labelEn: 'With Materials' },
        { value: 'Labor Only (Per Sqft / Contract)', labelBn: 'শুধু মজুরি (স্কয়ার ফিট / চুক্তি)', labelEn: 'Labor Only' },
        { value: 'Daily Mistri Basis', labelBn: 'দৈনিক হাজিরা ভিত্তিক', labelEn: 'Daily Basis' },
      ],
    },
  ],
  featuresLabelBn: 'পেইন্টিং সেবার বৈশিষ্ট্য',
  featuresLabelEn: 'Painting Features',
  features: [
    { value: 'Berger / Asian Paints Specialist', labelBn: 'বার্জার / এশিয়ান পেইন্টস দক্ষতা', labelEn: 'Branded Paint Specialist' },
    { value: 'Clean Floor & Furniture Cover', labelBn: 'কাজ শেষে ঘর পরিষ্কার', labelEn: 'Post-Paint Cleanup' },
    { value: 'Illusion & Texture Wall', labelBn: 'ডিজাইন ও টেক্সচার ওয়াল', labelEn: 'Texture & Accent Wall' },
    { value: 'Full Team Available', labelBn: 'বড় প্রজেক্টের জন্য টিম আছে', labelEn: 'Full Painting Team' },
  ],
};

const MECHANIC_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'vehicleCategory',
      labelBn: 'যানবাহনের ধরন',
      labelEn: 'Vehicle Category',
      type: 'select',
      options: [
        { value: 'Motorcycle & Scooter', labelBn: 'মোটরসাইকেল ও স্কুটার', labelEn: 'Motorcycle & Scooter' },
        { value: 'Private Car & Hybrid', labelBn: 'প্রাইভেট কার ও হাইব্রিড গাড়ি', labelEn: 'Private Car & Hybrid' },
        { value: 'Microbus / Pickup / Truck', labelBn: 'মাইক্রোবাস / পিকআপ / ট্রাক', labelEn: 'Microbus / Pickup' },
        { value: 'CNG / Auto / E-Bike', labelBn: 'সিএনজি / অটো / ই-বাইক', labelEn: 'CNG / E-Bike' },
      ],
    },
    {
      key: 'repairType',
      labelBn: 'সার্ভিসের ধরন',
      labelEn: 'Service Specialty',
      type: 'select',
      options: [
        { value: 'Engine Tuning & Master Service', labelBn: 'ইঞ্জিন টিউনিং ও মাস্টার সার্ভিস', labelEn: 'Engine & Master Service' },
        { value: 'Roadside Emergency Breakdown', labelBn: 'রাস্তায় জরুরি ব্রেকডাউন সাপোর্ট', labelEn: 'Roadside Emergency' },
        { value: 'Car AC, Battery & Wiring', labelBn: 'গাড়ির এসি, ব্যাটারি ও স্ক্যানিং', labelEn: 'Car AC, Battery & Scan' },
        { value: 'Denting & Painting', labelBn: 'ডেন্টিং ও পেইন্টিং', labelEn: 'Denting & Painting' },
      ],
    },
  ],
  featuresLabelBn: 'মেকানিক সুবিধা',
  featuresLabelEn: 'Mechanic Highlights',
  features: [
    { value: 'On-Spot Roadside Help', labelBn: 'লোকেশনে গিয়ে সার্ভিস', labelEn: 'On-Spot Roadside Service' },
    { value: 'OBD Computer Diagnostics', labelBn: 'কম্পিউটারাইজড স্ক্যানিং', labelEn: 'OBD Diagnostics' },
    { value: 'Genuine Spare Parts', labelBn: 'অরিজিনাল পার্টস সুবিধা', labelEn: 'Genuine Parts' },
    { value: 'Home Pickup & Drop', labelBn: 'গাড়ি পিকআপ ও ডেলিভারি', labelEn: 'Pickup & Drop' },
  ],
};

const CLEANER_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'cleaningScope',
      labelBn: 'পরিষ্কারের ধরন',
      labelEn: 'Cleaning Service Type',
      type: 'select',
      options: [
        { value: 'Full Home Deep Cleaning', labelBn: 'বাসার ডিপ ক্লিনিং (ফ্লোর, বাথরুম, কিচেন)', labelEn: 'Home Deep Cleaning' },
        { value: 'Sofa, Carpet & Mattress Wash', labelBn: 'সোফা, কার্পেট ও ম্যাট্রেস ওয়াশ', labelEn: 'Sofa & Carpet Wash' },
        { value: 'Water Tank & Reserve Tank', labelBn: 'পানির ট্যাংক ও রিজার্ভার পরিষ্কার', labelEn: 'Water Tank Sanitization' },
        { value: 'Office & Glass Facade', labelBn: 'অফিস ও গ্লাস ক্লিনিং', labelEn: 'Office & Glass Cleaning' },
      ],
    },
    {
      key: 'teamSize',
      labelBn: 'টিমের আকার',
      labelEn: 'Team Capacity',
      type: 'select',
      options: [
        { value: 'Individual Cleaner', labelBn: 'একক ক্লিনার', labelEn: 'Solo Cleaner' },
        { value: '2–3 Person Crew', labelBn: '২–৩ জনের টিম', labelEn: '2–3 Person Crew' },
        { value: '4+ Commercial Team', labelBn: '৪+ জনের প্রফেশনাল টিম', labelEn: '4+ Pro Team' },
      ],
    },
  ],
  featuresLabelBn: 'ক্লিনিং সেবার বৈশিষ্ট্য',
  featuresLabelEn: 'Cleaning Features',
  features: [
    { value: 'Vacuum & Shampoo Machine', labelBn: 'ভ্যাকুয়াম ও শ্যাম্পু মেশিনসহ', labelEn: 'Vacuum & Shampoo Machine' },
    { value: 'Eco-Safe Chemicals', labelBn: 'নিরাপদ ও দুর্গন্ধমুক্ত কেমিক্যাল', labelEn: 'Safe Cleaning Agents' },
    { value: 'Female Cleaner Available', labelBn: 'মহিলা ক্লিনার সুবিধা', labelEn: 'Female Staff Available' },
    { value: 'Monthly Office Contract', labelBn: 'মাসিক অফিস চুক্তি', labelEn: 'Monthly Contract' },
  ],
};

const COMPUTER_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'itService',
      labelBn: 'কাজের ধরন',
      labelEn: 'IT / Tech Work',
      type: 'select',
      options: [
        { value: 'Laptop & Desktop Hardware Repair', labelBn: 'ল্যাপটপ ও ডেস্কটপ হার্ডওয়্যার মেরামত', labelEn: 'Laptop/PC Hardware Repair' },
        { value: 'Windows/Mac OS & SSD Upgrade', labelBn: 'উইন্ডোজ সেটআপ ও SSD/RAM আপগ্রেড', labelEn: 'OS Setup & SSD Upgrade' },
        { value: 'Wi-Fi Router, Fiber & LAN Setup', labelBn: 'ওয়াইফাই রাউটার ও অফিস নেটওয়ার্কিং', labelEn: 'Wi-Fi & Networking' },
        { value: 'CCTV Camera & Biometric Setup', labelBn: 'সিসিটিভি ক্যামেরা ও এক্সেস কন্ট্রোল', labelEn: 'CCTV Camera Installation' },
        { value: 'Printer & Toner Refill', labelBn: 'প্রিন্টার মেরামত ও টোনার রিফিল', labelEn: 'Printer & Toner' },
      ],
    },
    {
      key: 'visitType',
      labelBn: 'সেবা নেওয়ার মাধ্যম',
      labelEn: 'Service Location',
      type: 'select',
      options: [
        { value: 'Home & Office Visit', labelBn: 'বাসা বা অফিসে গিয়ে সার্ভিস', labelEn: 'Home/Office Visit' },
        { value: 'At Repair Lab / Shop', labelBn: 'দোকানে / ল্যাবে এনে কাজ', labelEn: 'At Shop / Lab' },
        { value: 'Remote Support (AnyDesk)', labelBn: 'অনলাইন রিমোট সাপোর্ট', labelEn: 'Remote Support' },
      ],
    },
  ],
  featuresLabelBn: 'কম্পিউটার ও টেক সুবিধা',
  featuresLabelEn: 'IT Support Features',
  features: [
    { value: 'Data Recovery Safe', labelBn: 'নিরাপদ ডেটা রিকভারি', labelEn: 'Data Recovery' },
    { value: 'Same-Day Fix', labelBn: 'দ্রুত ডেলিভারি', labelEn: 'Same-Day Service' },
    { value: 'Mobile View CCTV', labelBn: 'মোবাইলে লাইভ সিসিটিভি সেটআপ', labelEn: 'Mobile CCTV Setup' },
    { value: 'Replacement Warranty', labelBn: 'পার্টস রিপ্লেসমেন্ট গ্যারান্টি', labelEn: 'Parts Warranty' },
  ],
};

const CONSTRUCTION_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'masonryType',
      labelBn: 'কাজের ধরন',
      labelEn: 'Construction Specialty',
      type: 'select',
      options: [
        { value: 'Tiles, Marble & Granite Fitting', labelBn: 'টাইলস, মার্বেল ও গ্রানাইট ফিটিং', labelEn: 'Tiles & Marble Fitting' },
        { value: 'Brick, Plaster & Casting', labelBn: 'গাঁথুনি, প্লাস্টার ও ঢালাই', labelEn: 'Masonry & Plaster' },
        { value: 'Home Renovation & Extension', labelBn: 'পুরানো বাসা সংস্কার ও রিনোভেশন', labelEn: 'Renovation' },
        { value: 'Grill, Gate & Thai Glass', labelBn: 'থাই গ্লাস, গ্রিল ও গেট', labelEn: 'Thai Glass & Grill' },
      ],
    },
    {
      key: 'crewCapacity',
      labelBn: 'কাজের ধরন',
      labelEn: 'Team Size',
      type: 'select',
      options: [
        { value: 'Mistri + Helper', labelBn: 'মিস্ত্রি ও হেল্পার', labelEn: 'Mason + Helper' },
        { value: 'Full Contractor Team', labelBn: 'পূর্ণাঙ্গ ঠিকাদারি টিম', labelEn: 'Full Contractor Team' },
      ],
    },
  ],
  featuresLabelBn: 'নির্মাণ সেবার বৈশিষ্ট্য',
  featuresLabelEn: 'Construction Features',
  features: [
    { value: 'Laser Level Tiles Fitting', labelBn: 'লেজার লেভেল ফিনিশিং', labelEn: 'Precision Finishing' },
    { value: 'Sqft Contract', labelBn: 'স্কয়ার ফিট চুক্তিতে কাজ', labelEn: 'Per-Sqft Contract' },
    { value: 'Free Measurement & Estimate', labelBn: 'ফ্রি মাপজোখ ও বাজেট প্রাক্কলন', labelEn: 'Free Estimation' },
  ],
};

const CARPENTER_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'woodWork',
      labelBn: 'কাঠের কাজের ধরন',
      labelEn: 'Carpentry Type',
      type: 'select',
      options: [
        { value: 'Door, Frame & Lock Repair', labelBn: 'কাঠের দরজা, চৌকাঠ ও তালা ফিটিং', labelEn: 'Door & Lock Fitting' },
        { value: 'Custom Wardrobe & Kitchen Cabinet', labelBn: 'ওয়াল কেবিনেট, কিচেন ও ওয়ারড্রোব', labelEn: 'Custom Cabinets' },
        { value: 'Furniture Repair & Polish', labelBn: 'খাট, আলমারি, টেবিল মেরামত ও বার্নিশ', labelEn: 'Furniture Repair & Polish' },
        { value: 'Interior Wood & Gypsum Decor', labelBn: 'ইন্টেরিয়র ডেকোরেশন', labelEn: 'Interior Woodwork' },
      ],
    },
    {
      key: 'materialSkill',
      labelBn: 'কাঠ / বোর্ড অভিজ্ঞতা',
      labelEn: 'Material Expertise',
      type: 'text',
      placeholderBn: 'যেমন: সেগুন, মেহগনি, প্লাইউড, পার্টিকেল বোর্ড',
      placeholderEn: 'e.g., Teak, Mahogany, Plywood, Melamine',
    },
  ],
  featuresLabelBn: 'কাঠমিস্ত্রি সুবিধা',
  featuresLabelEn: 'Carpentry Highlights',
  features: [
    { value: 'Own Power Tools', labelBn: 'আধুনিক ইলেকট্রিক কাটার ও ড্রিল', labelEn: 'Power Tools Included' },
    { value: 'Home Service', labelBn: 'বাসায় গিয়ে মেরামত', labelEn: 'Home Visit Repair' },
    { value: 'Lacker & Hand Polish', labelBn: 'লেকার ও হ্যান্ড পালিশ', labelEn: 'Lacquer Polish' },
  ],
};

const APPLIANCE_REPAIR_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'applianceWork',
      labelBn: 'কোন অ্যাপ্লায়েন্স মেরামত করেন',
      labelEn: 'Appliance Type',
      type: 'select',
      options: [
        { value: 'Refrigerator & Deep Freezer', labelBn: 'ফ্রিজ ও ডিপ ফ্রিজ', labelEn: 'Refrigerator & Freezer' },
        { value: 'Washing Machine', labelBn: 'ওয়াশিং মেশিন (Front/Top Load)', labelEn: 'Washing Machine' },
        { value: 'Microwave Oven & Induction', labelBn: 'মাইক্রোওয়েভ ওভেন ও ইন্ডাকশন', labelEn: 'Microwave & Cooker' },
        { value: 'Geyser / Water Purifier / IPS', labelBn: 'গিজার, ওয়াটার ফিল্টার ও আইপিএস', labelEn: 'Geyser, Filter & IPS' },
      ],
    },
    {
      key: 'serviceGuarantee',
      labelBn: 'রিপেয়ার ওয়ারেন্টি',
      labelEn: 'Repair Warranty',
      type: 'select',
      options: [
        { value: '1 Month Warranty', labelBn: '১ মাসের ওয়ারেন্টি', labelEn: '1 Month Warranty' },
        { value: '3 Months on Replaced Parts', labelBn: 'নতুন পার্টসে ৩ মাসের ওয়ারেন্টি', labelEn: '3 Months Parts Warranty' },
        { value: 'No Warranty / Inspection First', labelBn: 'চেক করে জানানো হবে', labelEn: 'Check First' },
      ],
    },
  ],
  featuresLabelBn: 'সার্ভিস বৈশিষ্ট্য',
  featuresLabelEn: 'Service Features',
  features: [
    { value: 'Home Visit Diagnostics', labelBn: 'বাসায় গিয়ে পরীক্ষা ও মেরামত', labelEn: 'Home Visit Repair' },
    { value: 'Compressor & PCB Repair', labelBn: 'কম্প্রেসার ও সার্কিট রিপেয়ার', labelEn: 'Compressor & PCB' },
    { value: 'Same-Day Service', labelBn: 'একই দিনে সার্ভিস', labelEn: 'Same-Day Service' },
  ],
};

const PEST_CONTROL_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'pestTarget',
      labelBn: 'কোন পোকামাকড় নিধন সেবা',
      labelEn: 'Target Pest Type',
      type: 'select',
      options: [
        { value: 'Cockroach & Ant Gel', labelBn: 'তেলাপোকা ও পিঁপড়া (জেল ট্রিটমেন্ট)', labelEn: 'Cockroach & Ant' },
        { value: 'Bedbug (Charpoka)', labelBn: 'ছারপোকা দমন', labelEn: 'Bedbug Control' },
        { value: 'Termite (Uipoka)', labelBn: 'উইপোকা নিধন', labelEn: 'Termite Treatment' },
        { value: 'All-in-One Home Spray', labelBn: 'সম্পূর্ণ বাসার সমন্বিত স্প্রে ও ফগিং', labelEn: 'Full Home Pest Package' },
      ],
    },
    {
      key: 'safetyNote',
      labelBn: 'নিরাপত্তা ধরন',
      labelEn: 'Treatment Formula',
      type: 'select',
      options: [
        { value: 'Odorless Baby & Pet Safe', labelBn: 'গন্ধহীন ও শিশু-নিরাপদ জেল', labelEn: 'Odorless & Child-Safe' },
        { value: 'Heavy Herbal / Chemical Spray', labelBn: 'হাই-পাওয়ার স্প্রে ট্রিটমেন্ট', labelEn: 'Heavy Spray Treatment' },
      ],
    },
  ],
  featuresLabelBn: 'পেস্ট কন্ট্রোল বৈশিষ্ট্য',
  featuresLabelEn: 'Pest Control Features',
  features: [
    { value: '6-Month Service Warranty', labelBn: '৬ মাসের সার্ভিস গ্যারান্টি', labelEn: '6-Month Warranty' },
    { value: 'Free Follow-up Visit', labelBn: 'ফ্রি ফলো-আপ ভিজিট', labelEn: 'Free Follow-Up' },
    { value: 'No Need to Leave Home', labelBn: 'বাসা খালি না করেই করা যায়', labelEn: 'Stay-at-Home Safe' },
  ],
};

const SECONDHAND_ELECTRONICS_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'deviceType',
      labelBn: 'ডিভাইসের ধরন',
      labelEn: 'Device Type',
      type: 'select',
      options: [
        { value: 'Smartphone', labelBn: 'স্মার্টফোন', labelEn: 'Smartphone' },
        { value: 'Laptop', labelBn: 'ল্যাপটপ', labelEn: 'Laptop' },
        { value: 'Desktop PC / Monitor', labelBn: 'ডেস্কটপ পিসি / মনিটর', labelEn: 'Desktop PC / Monitor' },
        { value: 'Tablet / iPad', labelBn: 'ট্যাবলেট / আইপ্যাড', labelEn: 'Tablet / iPad' },
        { value: 'Smartwatch / Earbuds', labelBn: 'স্মার্টওয়াচ / অডিও', labelEn: 'Smartwatch / Audio' },
        { value: 'DSLR Camera / Drone', labelBn: 'ক্যামেরা / ড্রোন', labelEn: 'Camera / Drone' },
      ],
    },
    {
      key: 'brand',
      labelBn: 'ব্র্যান্ড (Brand)',
      labelEn: 'Brand',
      type: 'select',
      options: [
        { value: 'Apple', labelBn: 'Apple (iPhone / MacBook)', labelEn: 'Apple' },
        { value: 'Samsung', labelBn: 'Samsung', labelEn: 'Samsung' },
        { value: 'Xiaomi', labelBn: 'Xiaomi / Redmi / Poco', labelEn: 'Xiaomi' },
        { value: 'Realme', labelBn: 'Realme', labelEn: 'Realme' },
        { value: 'OnePlus', labelBn: 'OnePlus', labelEn: 'OnePlus' },
        { value: 'Vivo / Oppo', labelBn: 'Vivo / Oppo', labelEn: 'Vivo / Oppo' },
        { value: 'Google Pixel', labelBn: 'Google Pixel', labelEn: 'Google Pixel' },
        { value: 'HP / Dell / Lenovo', labelBn: 'HP / Dell / Lenovo', labelEn: 'HP / Dell / Lenovo' },
        { value: 'Asus / Acer', labelBn: 'Asus / Acer / MSI', labelEn: 'Asus / Acer' },
      ],
    },
    {
      key: 'model',
      labelBn: 'মডেল নাম',
      labelEn: 'Model Name',
      type: 'text',
      placeholderBn: 'যেমন: iPhone 14 Pro / Galaxy A55 / ThinkPad X1',
      placeholderEn: 'e.g., iPhone 14 Pro / Galaxy A55 / ThinkPad X1',
    },
    {
      key: 'memoryStorage',
      labelBn: 'র‍্যাম ও স্টোরেজ (RAM / Storage)',
      labelEn: 'RAM / Storage',
      type: 'select',
      options: [
        { value: '4GB / 64GB', labelBn: '৪ জিবি / ৬৪ জিবি', labelEn: '4GB / 64GB' },
        { value: '6GB / 128GB', labelBn: '৬ জিবি / ১২৮ জিবি', labelEn: '6GB / 128GB' },
        { value: '8GB / 128GB', labelBn: '৮ জিবি / ১২৮ জিবি', labelEn: '8GB / 128GB' },
        { value: '8GB / 256GB', labelBn: '৮ জিবি / ২৫৬ জিবি', labelEn: '8GB / 256GB' },
        { value: '12GB / 256GB', labelBn: '১২ জিবি / ২৫৬ জিবি', labelEn: '12GB / 256GB' },
        { value: '16GB / 512GB SSD', labelBn: '১৬ জিবি / ৫১২ জিবি এসএসডি', labelEn: '16GB / 512GB SSD' },
      ],
    },
  ],
  featuresLabelBn: 'ডিভাইসের ফিচার ও ডকুমেন্টস',
  featuresLabelEn: 'Device Features & Included Items',
  features: [
    { value: 'Official / BTRC Approved', labelBn: 'অফিসিয়াল / বিটিআরসি নিবন্ধিত', labelEn: 'Official / BTRC Approved' },
    { value: 'Original Box & IMEI Match', labelBn: 'অরিজিনাল বক্স ও আইএমইআই ম্যাচ', labelEn: 'Original Box & IMEI Match' },
    { value: 'Original Charger', labelBn: 'অরিজিনাল চার্জারসহ', labelEn: 'Original Charger Included' },
    { value: 'Cash Memo / Warranty', labelBn: 'ক্যাশ মেমো / ওয়ারেন্টি আছে', labelEn: 'Receipt / Warranty' },
    { value: 'Never Repaired', labelBn: 'কখনো খোলা বা রিপেয়ার হয়নি', labelEn: 'Never Repaired' },
    { value: '5G & Dual SIM', labelBn: '৫জি ও ডুয়েল সিম', labelEn: '5G & Dual SIM' },
    { value: 'FaceID / Fingerprint OK', labelBn: 'ফেস আইডি / ফিঙ্গারপ্রিন্ট ওকে', labelEn: 'Biometrics Working' },
    { value: 'Exchange Possible', labelBn: 'এক্সচেঞ্জ সম্ভব', labelEn: 'Open to Exchange' },
  ],
};

const SECONDHAND_VEHICLES_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'vehicleType',
      labelBn: 'যানবাহনের ধরন',
      labelEn: 'Vehicle Type',
      type: 'select',
      options: [
        { value: 'Motorcycle', labelBn: 'মোটরসাইকেল', labelEn: 'Motorcycle' },
        { value: 'Scooter / E-Bike', labelBn: 'স্কুটার / ই-বাইক', labelEn: 'Scooter / E-Bike' },
        { value: 'Bicycle', labelBn: 'বাইসাইকেল', labelEn: 'Bicycle' },
        { value: 'Private Car', labelBn: 'প্রাইভেট কার', labelEn: 'Private Car' },
      ],
    },
    {
      key: 'brand',
      labelBn: 'ব্র্যান্ড',
      labelEn: 'Brand',
      type: 'select',
      options: [
        { value: 'Yamaha', labelBn: 'Yamaha', labelEn: 'Yamaha' },
        { value: 'Honda', labelBn: 'Honda', labelEn: 'Honda' },
        { value: 'Suzuki', labelBn: 'Suzuki', labelEn: 'Suzuki' },
        { value: 'Bajaj / TVS', labelBn: 'Bajaj / TVS', labelEn: 'Bajaj / TVS' },
        { value: 'Hero / Runner', labelBn: 'Hero / Runner', labelEn: 'Hero / Runner' },
        { value: 'Royal Enfield', labelBn: 'Royal Enfield', labelEn: 'Royal Enfield' },
        { value: 'Duronto / Phoenix', labelBn: 'Duronto / Phoenix / Core', labelEn: 'Duronto / Phoenix / Core' },
        { value: 'Toyota / Nissan', labelBn: 'Toyota / Nissan / Honda Car', labelEn: 'Toyota / Nissan' },
      ],
    },
    {
      key: 'modelYear',
      labelBn: 'মডেল, সাল ও কি.মি.',
      labelEn: 'Model, Year & Mileage',
      type: 'text',
      placeholderBn: 'যেমন: FZ-S V3 (২০২২), ১২,০০০ কি.মি.',
      placeholderEn: 'e.g., FZ-S V3 (2022), 12,000 km',
    },
    {
      key: 'engineCC',
      labelBn: 'ইঞ্জিন সিসি / সাইজ',
      labelEn: 'Engine CC / Frame',
      type: 'select',
      options: [
        { value: '100cc - 125cc', labelBn: '১০০–১২৫ সিসি', labelEn: '100cc – 125cc' },
        { value: '150cc - 165cc', labelBn: '১৫০–১৬৫ সিসি', labelEn: '150cc – 165cc' },
        { value: '250cc+', labelBn: '২৫০+ সিসি / কার', labelEn: '250cc+ / Car' },
        { value: 'Gear Bicycle / Non-Motor', labelBn: 'গিয়ার বাইসাইকেল', labelEn: 'Bicycle / Non-Motor' },
      ],
    },
  ],
  featuresLabelBn: 'কাগজপত্র ও কন্ডিশন',
  featuresLabelEn: 'Registration & Condition',
  features: [
    { value: 'Smart Card & Tax Token', labelBn: 'স্মার্ট কার্ড ও ট্যাক্স টোকেন আপডেটেড', labelEn: 'Smart Card & Tax Token Ready' },
    { value: 'Digital Number Plate', labelBn: 'ডিজিটাল নাম্বার প্লেট (BRTA)', labelEn: 'Digital Plate (BRTA)' },
    { value: 'First Owner', labelBn: 'প্রথম মালিক / নাম পরিবর্তন সম্ভব', labelEn: 'First Owner / Transfer Ready' },
    { value: 'Untouched Engine', labelBn: 'আনটাচ ইঞ্জিন', labelEn: 'Untouched Engine' },
    { value: 'ABS Braking', labelBn: 'ABS ব্রেকিং সিস্টেম', labelEn: 'ABS Braking' },
  ],
};

const SECONDHAND_FURNITURE_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'furnitureType',
      labelBn: 'ফার্নিচারের ধরন',
      labelEn: 'Furniture Type',
      type: 'select',
      options: [
        { value: 'Bed / Khat', labelBn: 'খাট (King / Semi-Double)', labelEn: 'Bed' },
        { value: 'Wardrobe / Almirah', labelBn: 'আলমারি / ওয়ারড্রোব', labelEn: 'Wardrobe / Almirah' },
        { value: 'Sofa Set', labelBn: 'সোফা সেট', labelEn: 'Sofa Set' },
        { value: 'Dining Table', labelBn: 'ডাইনিং টেবিল', labelEn: 'Dining Table' },
        { value: 'Reading / Office Desk', labelBn: 'পড়ার টেবিল / অফিস ডেস্ক', labelEn: 'Desk / Office Chair' },
      ],
    },
    {
      key: 'material',
      labelBn: 'উপাদান (কাঠ/বোর্ড/স্টিল)',
      labelEn: 'Material',
      type: 'select',
      options: [
        { value: 'Teak / Segun Wood', labelBn: 'সেগুন কাঠ', labelEn: 'Teak / Segun Wood' },
        { value: 'Mahogany / Gamari', labelBn: 'মেহগনি / গামারি কাঠ', labelEn: 'Mahogany / Gamari' },
        { value: 'Engineered Wood / Melamine', labelBn: 'মেলামাইন বোর্ড (Hatil/Otobi)', labelEn: 'Melamine Board' },
        { value: 'Steel / Metal', labelBn: 'স্টিল / মেটাল', labelEn: 'Steel / Metal' },
      ],
    },
    {
      key: 'sizeNote',
      labelBn: 'সাইজ / ব্যবহারের সময়কাল',
      labelEn: 'Size / Age',
      type: 'text',
      placeholderBn: 'যেমন: ৫x৭ ফিট, ১ বছর ব্যবহৃত',
      placeholderEn: 'e.g., 5x7 ft, 1 year used',
    },
  ],
  featuresLabelBn: 'অতিরিক্ত তথ্য',
  featuresLabelEn: 'Highlights',
  features: [
    { value: 'Branded (Hatil/Otobi/Regal)', labelBn: 'ব্র্যান্ডেড (হাতিল/অটবি/রিগ্যাল)', labelEn: 'Branded Furniture' },
    { value: 'No Termites / Damage', labelBn: 'ঘুণে ধরা বা ভাঙা নেই', labelEn: 'No Damage / Termite-Free' },
    { value: 'Fresh Polish', labelBn: 'ফ্রেশ পালিশ করা', labelEn: 'Fresh Polish' },
    { value: 'Home Pickup Only', labelBn: 'বাসা থেকে সংগ্রহ করতে হবে', labelEn: 'Home Pickup' },
  ],
};

const SECONDHAND_APPLIANCES_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'applianceType',
      labelBn: 'পণ্যের ধরন',
      labelEn: 'Appliance Type',
      type: 'select',
      options: [
        { value: 'Refrigerator', labelBn: 'ফ্রিজ / রেফ্রিজারেটর', labelEn: 'Refrigerator' },
        { value: 'Air Conditioner', labelBn: 'এসি (Split / Window)', labelEn: 'Air Conditioner' },
        { value: 'Smart TV', labelBn: 'স্মার্ট / এলইডি টিভি', labelEn: 'Smart / LED TV' },
        { value: 'Washing Machine', labelBn: 'ওয়াশিং মেশিন', labelEn: 'Washing Machine' },
        { value: 'Oven / IPS / UPS', labelBn: 'ওভেন / আইপিএস / জেনারেটর', labelEn: 'Oven / IPS' },
      ],
    },
    {
      key: 'brand',
      labelBn: 'ব্র্যান্ড',
      labelEn: 'Brand',
      type: 'select',
      options: [
        { value: 'Walton / Marcel', labelBn: 'Walton / Marcel', labelEn: 'Walton / Marcel' },
        { value: 'Samsung / LG', labelBn: 'Samsung / LG', labelEn: 'Samsung / LG' },
        { value: 'Gree / General', labelBn: 'Gree / General / Midea', labelEn: 'Gree / General / Midea' },
        { value: 'Sony / Singer', labelBn: 'Sony / Singer / Vision', labelEn: 'Sony / Singer / Vision' },
      ],
    },
    {
      key: 'capacity',
      labelBn: 'ধারণক্ষমতা / সাইজ',
      labelEn: 'Capacity / Ton / Inch',
      type: 'text',
      placeholderBn: 'যেমন: ১.৫ টন ইনভার্টার / ২৫০ লিটার',
      placeholderEn: 'e.g., 1.5 Ton Inverter / 250L',
    },
  ],
  featuresLabelBn: 'কন্ডিশন ও ফিচার',
  featuresLabelEn: 'Condition & Features',
  features: [
    { value: 'Inverter Tech', labelBn: 'ইনভার্টার টেকনোলজি', labelEn: 'Inverter Technology' },
    { value: '100% Cooling / Working', labelBn: 'সম্পূর্ণ সচল ও ভালো কুলিং', labelEn: '100% Working Condition' },
    { value: 'Original Compressor', labelBn: 'অরিজিনাল কম্প্রেসার', labelEn: 'Original Compressor' },
    { value: 'Warranty Paper', labelBn: 'ওয়ারেন্টি কার্ড আছে', labelEn: 'Warranty Available' },
  ],
};

const HOUSE_RENT_FAMILY_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'bedrooms',
      labelBn: 'বেডরুম সংখ্যা',
      labelEn: 'Bedrooms',
      type: 'select',
      options: [
        { value: '1 Bedroom Studio', labelBn: '১ বেডরুম', labelEn: '1 Bedroom' },
        { value: '2 Bedrooms', labelBn: '২ বেডরুম', labelEn: '2 Bedrooms' },
        { value: '3 Bedrooms', labelBn: '৩ বেডরুম', labelEn: '3 Bedrooms' },
        { value: '4+ Bedrooms', labelBn: '৪+ বেডরুম', labelEn: '4+ Bedrooms' },
      ],
    },
    {
      key: 'bathrooms',
      labelBn: 'বাথরুম ও বারান্দা',
      labelEn: 'Bathrooms & Balconies',
      type: 'select',
      options: [
        { value: '1 Bath · 1 Balcony', labelBn: '১ বাথ · ১ বারান্দা', labelEn: '1 Bath · 1 Balcony' },
        { value: '2 Baths · 2 Balconies', labelBn: '২ বাথ · ২ বারান্দা', labelEn: '2 Baths · 2 Balconies' },
        { value: '3+ Baths · 2+ Balconies', labelBn: '৩+ বাথ · ২+ বারান্দা', labelEn: '3+ Baths · 2+ Balconies' },
      ],
    },
    {
      key: 'floor',
      labelBn: 'ফ্লোর / তলা',
      labelEn: 'Floor Level',
      type: 'select',
      options: [
        { value: 'Ground Floor', labelBn: 'নিচতলা', labelEn: 'Ground Floor' },
        { value: '2nd–3rd Floor', labelBn: '২য়–৩য় তলা', labelEn: '2nd–3rd Floor' },
        { value: '4th–6th Floor', labelBn: '৪র্থ–৬ষ্ঠ তলা', labelEn: '4th–6th Floor' },
        { value: '7th+ Floor', labelBn: '৭ম তলা বা উপরে', labelEn: '7th+ Floor' },
      ],
    },
    {
      key: 'sizeSqft',
      labelBn: 'আয়তন ও ভাড়ার মাস',
      labelEn: 'Size (Sqft) & Move-in Month',
      type: 'text',
      placeholderBn: 'যেমন: ১২৫০ বর্গফুট · আগামী মাস থেকে',
      placeholderEn: 'e.g., 1250 sqft · Next month',
    },
  ],
  featuresLabelBn: 'ফ্ল্যাটের সুবিধাসমূহ',
  featuresLabelEn: 'Apartment Amenities',
  features: [
    { value: 'Lift', labelBn: 'লিফট সুবিধা', labelEn: 'Lift / Elevator' },
    { value: 'Line / Titas Gas', labelBn: 'লাইনের তিতাস গ্যাস', labelEn: 'Line Gas' },
    { value: 'Cylinder Gas', labelBn: 'সিলিন্ডার গ্যাস সিস্টেম', labelEn: 'Cylinder Gas' },
    { value: 'Generator / IPS', labelBn: 'জেনারেটর ব্যাকআপ', labelEn: 'Generator Backup' },
    { value: '24/7 Security / CCTV', labelBn: 'সিকিউরিটি ও সিসিটিভি', labelEn: '24/7 Security & CCTV' },
    { value: 'Parking', labelBn: 'গাড়ি / বাইক পার্কিং', labelEn: 'Car/Bike Parking' },
    { value: 'Tiles & South Facing', labelBn: 'সম্পূর্ণ টাইলস ও দক্ষিণমুখী', labelEn: 'Tiled & South-Facing' },
  ],
};

const HOUSE_RENT_BACHELOR_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'seatType',
      labelBn: 'সিট / রুমের ধরন',
      labelEn: 'Seat / Room Type',
      type: 'select',
      options: [
        { value: '1 Seat in Shared Room', labelBn: 'শেয়ার্ড রুমে ১ সিট', labelEn: '1 Seat (Shared)' },
        { value: 'Single Private Room', labelBn: 'একক প্রাইভেট রুম', labelEn: 'Single Private Room' },
        { value: 'Full Bachelor Flat', labelBn: 'সম্পূর্ণ ব্যাচেলর ফ্ল্যাট', labelEn: 'Full Bachelor Flat' },
        { value: 'Hostel / Mess Seat', labelBn: 'মেস / হোস্টেল সিট', labelEn: 'Hostel / Mess' },
      ],
    },
    {
      key: 'tenantFor',
      labelBn: 'কাদের জন্য প্রযোজ্য',
      labelEn: 'Preferred Tenants',
      type: 'select',
      options: [
        { value: 'Male Students / Job Holders', labelBn: 'ছাত্র / চাকরিজীবী (পুরুষ)', labelEn: 'Male Students / Job' },
        { value: 'Female Students / Job Holders', labelBn: 'ছাত্রী / চাকরিজীবী (মহিলা)', labelEn: 'Female Students / Job' },
      ],
    },
    {
      key: 'mealInfo',
      labelBn: 'খাওয়া / বুয়া ব্যবস্থা',
      labelEn: 'Meal & Maid Facility',
      type: 'select',
      options: [
        { value: 'Mess Meal & Bua Included', labelBn: 'মিল ও বুয়া ব্যবস্থা আছে', labelEn: 'Mess Meal & Maid' },
        { value: 'Self Cooking Kitchen', labelBn: 'নিজে রান্নার কিচেন আছে', labelEn: 'Self Cooking' },
      ],
    },
  ],
  featuresLabelBn: 'মেস / সিটের সুবিধাসমূহ',
  featuresLabelEn: 'Room Amenities',
  features: [
    { value: 'High-Speed Wi-Fi', labelBn: 'হাই-স্পিড ওয়াইফাই', labelEn: 'Wi-Fi Ready' },
    { value: 'Bed & Table Provided', labelBn: 'খাট ও পড়ার টেবিল আছে', labelEn: 'Furnished Bed & Desk' },
    { value: 'Filter Water & Fridge', labelBn: 'ফ্রিজ ও ফিল্টার পানি', labelEn: 'Fridge & Water Filter' },
    { value: 'No Extra Service Charge', labelBn: 'আলাদা সার্ভিস চার্জ নেই', labelEn: 'No Extra Charge' },
    { value: 'Bike Parking', labelBn: 'বাইক পার্কিং', labelEn: 'Bike Parking' },
  ],
};

const HOUSE_RENT_SUBLET_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'subletRoom',
      labelBn: 'সাবলেট রুমের ধরন',
      labelEn: 'Sublet Room Type',
      type: 'select',
      options: [
        { value: 'Master Bed with Attached Bath', labelBn: 'মাস্টার বেড (অ্যাটাচড বাথ ও বারান্দা)', labelEn: 'Master Bed + Attached Bath' },
        { value: 'Standard Room with Common Bath', labelBn: 'সাধারণ রুম (কমন বাথ)', labelEn: 'Standard Room' },
        { value: 'Semi-Furnished Room', labelBn: 'ফার্নিচারসহ রুম', labelEn: 'Furnished Sublet' },
      ],
    },
    {
      key: 'tenantPref',
      labelBn: 'কাকে ভাড়া দেওয়া হবে',
      labelEn: 'Tenant Preference',
      type: 'select',
      options: [
        { value: 'Small Family / Husband-Wife', labelBn: 'ছোট ফ্যামিলি / স্বামী-স্ত্রী', labelEn: 'Small Family / Couple' },
        { value: 'Working Woman / Female Student', labelBn: 'কর্মজীবী মহিলা / ছাত্রী', labelEn: 'Female Only' },
        { value: 'Male Job Holder', labelBn: 'পুরুষ চাকরিজীবী', labelEn: 'Male Working' },
      ],
    },
  ],
  featuresLabelBn: 'সাবলেট সুবিধাসমূহ',
  featuresLabelEn: 'Sublet Amenities',
  features: [
    { value: 'Gas, Electricity, Water Included', labelBn: 'গ্যাস-বিদ্যুৎ-পানি বিলসহ', labelEn: 'All Utilities Included' },
    { value: 'Kitchen Access', labelBn: 'রান্নাঘর ব্যবহারের সুযোগ', labelEn: 'Kitchen Access' },
    { value: 'Wi-Fi & Lift', labelBn: 'ওয়াইফাই ও লিফট', labelEn: 'Wi-Fi & Lift' },
    { value: 'Quiet & Safe Environment', labelBn: 'নিরিবিলি ও নিরাপদ পরিবেশ', labelEn: 'Quiet Environment' },
  ],
};

const HOUSE_RENT_OFFICE_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'spaceKind',
      labelBn: 'বাণিজ্যিক স্পেসের ধরন',
      labelEn: 'Commercial Space Type',
      type: 'select',
      options: [
        { value: 'Retail Shop / Showroom', labelBn: 'দোকান / শোরুম', labelEn: 'Shop / Showroom' },
        { value: 'Corporate / IT Office Floor', labelBn: 'অফিস স্পেস / ফ্লোর', labelEn: 'Office Space' },
        { value: 'Coaching / Training Center', labelBn: 'কোচিং / ট্রেনিং সেন্টার', labelEn: 'Coaching / Institute' },
        { value: 'Godown / Storage', labelBn: 'গুদাম / স্টোরেজ', labelEn: 'Warehouse / Godown' },
      ],
    },
    {
      key: 'areaSqft',
      labelBn: 'আয়তন (বর্গফুট)',
      labelEn: 'Area (Sqft)',
      type: 'text',
      placeholderBn: 'যেমন: ৮০০ বর্গফুট / ২ শাটার দোকান',
      placeholderEn: 'e.g., 800 sqft / 2 Shutter Shop',
    },
  ],
  featuresLabelBn: 'অফিস ও দোকানের সুবিধা',
  featuresLabelEn: 'Commercial Features',
  features: [
    { value: 'Main Road Facing', labelBn: 'মেইন রোড সংলগ্ন', labelEn: 'Main Road Facing' },
    { value: 'Glass Front & AC Ready', labelBn: 'থাই গ্লাস ও এসি রেডি', labelEn: 'Glass Front & AC Ready' },
    { value: '3-Phase Power & Generator', labelBn: 'থ্রি-ফেজ ও জেনারেটর', labelEn: '3-Phase & Generator' },
    { value: 'Lift & Basement Parking', labelBn: 'লিফট ও পার্কিং', labelEn: 'Lift & Parking' },
  ],
};

const GENERAL_SERVICE_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'serviceScope',
      labelBn: 'কাজের পরিসর',
      labelEn: 'Service Scope',
      type: 'select',
      options: [
        { value: 'Residential & Home', labelBn: 'বাসা-বাড়ির কাজ', labelEn: 'Residential / Home' },
        { value: 'Office & Commercial', labelBn: 'অফিস ও বাণিজ্যিক', labelEn: 'Office & Commercial' },
        { value: 'Both Home & Commercial', labelBn: 'বাসা ও অফিস উভয়ই', labelEn: 'Home & Commercial' },
      ],
    },
    {
      key: 'availability',
      labelBn: 'সেবা প্রদানের সময়',
      labelEn: 'Availability',
      type: 'select',
      options: [
        { value: 'Morning – Evening (8AM–9PM)', labelBn: 'সকাল ৮টা – রাত ৯টা', labelEn: '8AM – 9PM Daily' },
        { value: '24/7 Emergency', labelBn: '২৪ ঘণ্টা জরুরি সেবা', labelEn: '24/7 Emergency' },
        { value: 'By Appointment', labelBn: 'অ্যাপয়েন্টমেন্ট অনুযায়ী', labelEn: 'By Appointment' },
      ],
    },
    {
      key: 'specialtyNote',
      labelBn: 'বিশেষ দক্ষতা / যন্ত্রপাতি',
      labelEn: 'Specialty / Equipment',
      type: 'text',
      placeholderBn: 'যেমন: আধুনিক যন্ত্রপাতিসহ জরুরি ভিজিট',
      placeholderEn: 'e.g., Modern tools & emergency support',
    },
  ],
  featuresLabelBn: 'সেবার বৈশিষ্ট্যসমূহ',
  featuresLabelEn: 'Service Highlights',
  features: [
    { value: 'Same-Day Visit', labelBn: 'একই দিনে হোম ভিজিট', labelEn: 'Same-Day Visit' },
    { value: 'Free Estimation', labelBn: 'ফ্রি প্রাক্কলন / পরিদর্শন', labelEn: 'Free Cost Estimate' },
    { value: 'Service Warranty', labelBn: 'কাজের পর সার্ভিস গ্যারান্টি', labelEn: 'Post-Service Warranty' },
    { value: 'Own Tools & Parts', labelBn: 'নিজস্ব যন্ত্রপাতি ও পার্টস', labelEn: 'Own Tools & Parts' },
    { value: 'Weekend Available', labelBn: 'শুক্র ও শনিবার খোলা', labelEn: 'Open on Weekends' },
  ],
};

const GENERAL_OTHER_SECONDHAND_SPEC: CategorySpecConfig = {
  fields: [
    {
      key: 'brand',
      labelBn: 'ব্র্যান্ড / প্রস্তুতকারক',
      labelEn: 'Brand / Maker',
      type: 'text',
      placeholderBn: 'ব্র্যান্ড বা নির্মাতার নাম (যদি থাকে)',
      placeholderEn: 'Brand or manufacturer name',
    },
    {
      key: 'usageAge',
      labelBn: 'কতদিন ব্যবহৃত হয়েছে',
      labelEn: 'Usage Duration',
      type: 'select',
      options: [
        { value: 'Less than 3 Months', labelBn: '৩ মাসের কম', labelEn: 'Under 3 Months' },
        { value: '3–6 Months Used', labelBn: '৩–৬ মাস ব্যবহৃত', labelEn: '3–6 Months' },
        { value: '6–12 Months Used', labelBn: '৬–১২ মাস ব্যবহৃত', labelEn: '6–12 Months' },
        { value: '1+ Year Used', labelBn: '১ বছরের বেশি', labelEn: '1+ Year' },
      ],
    },
  ],
  featuresLabelBn: 'ক্রেতাদের জন্য তথ্য',
  featuresLabelEn: 'Buyer Details',
  features: [
    { value: 'Original Receipt Available', labelBn: 'অরিজিনাল রসিদ আছে', labelEn: 'Original Receipt' },
    { value: 'Urgent Sale', labelBn: 'জরুরি বিক্রয়', labelEn: 'Urgent Sale' },
    { value: 'Negotiable Price', labelBn: 'দাম আলোচনা সাপেক্ষে', labelEn: 'Price Negotiable' },
    { value: 'Inspect Before Buy', labelBn: 'দেখে পরীক্ষা করে নেওয়ার সুযোগ', labelEn: 'Inspect Before Buying' },
  ],
};

export function getCategorySpecConfig(
  categorySlug: string,
  listingType: ListingType
): CategorySpecConfig {
  switch (categorySlug) {
    case 'tutor':
      return TUTOR_SPEC;
    case 'electrician':
      return ELECTRICIAN_SPEC;
    case 'ac-technician':
      return AC_SPEC;
    case 'plumber':
      return PLUMBER_SPEC;
    case 'painter':
      return PAINTER_SPEC;
    case 'mechanic':
      return MECHANIC_SPEC;
    case 'cleaner':
      return CLEANER_SPEC;
    case 'computer-tech':
      return COMPUTER_SPEC;
    case 'construction':
      return CONSTRUCTION_SPEC;
    case 'carpenter':
      return CARPENTER_SPEC;
    case 'appliance-repair':
      return APPLIANCE_REPAIR_SPEC;
    case 'pest-control':
      return PEST_CONTROL_SPEC;
    case 'house-rent-family':
      return HOUSE_RENT_FAMILY_SPEC;
    case 'house-rent-bachelor':
      return HOUSE_RENT_BACHELOR_SPEC;
    case 'house-rent-sublet':
      return HOUSE_RENT_SUBLET_SPEC;
    case 'house-rent-office':
      return HOUSE_RENT_OFFICE_SPEC;
    case 'secondhand-electronics':
      return SECONDHAND_ELECTRONICS_SPEC;
    case 'secondhand-vehicles':
      return SECONDHAND_VEHICLES_SPEC;
    case 'secondhand-furniture':
      return SECONDHAND_FURNITURE_SPEC;
    case 'secondhand-appliances':
      return SECONDHAND_APPLIANCES_SPEC;
    default:
      if (listingType === 'house-rent') return HOUSE_RENT_FAMILY_SPEC;
      if (listingType === 'secondhand') return GENERAL_OTHER_SECONDHAND_SPEC;
      return GENERAL_SERVICE_SPEC;
  }
}

export function buildSpecPayload(
  config: CategorySpecConfig,
  values: Record<string, string>,
  customValues: Record<string, string>,
  selectedFeatures: string[],
  lang: Language
): { specItems: string[]; summary: string } {
  const items: string[] = [];

  for (const field of config.fields) {
    const selectedRaw = (values[field.key] || '').trim();
    const customRaw = (customValues[field.key] || '').trim();
    const raw = selectedRaw === '__custom__' ? customRaw : selectedRaw;
    if (!raw) continue;

    let displayValue = raw;
    if (field.options && selectedRaw !== '__custom__') {
      const match = field.options.find((o) => o.value === raw);
      if (match) {
        displayValue = lang === 'bn' ? match.labelBn : match.labelEn;
      }
    }
    const label = lang === 'bn' ? field.labelBn : field.labelEn;
    items.push(`${label}: ${displayValue}`.slice(0, 80));
  }

  for (const featVal of selectedFeatures) {
    const match = config.features.find((f) => f.value === featVal);
    const label = match
      ? lang === 'bn'
        ? match.labelBn
        : match.labelEn
      : featVal;
    items.push(label.slice(0, 80));
  }

  const trimmed = items.slice(0, 16);
  const summary = trimmed.slice(0, 3).join(' · ').slice(0, 140);
  return { specItems: trimmed, summary };
}

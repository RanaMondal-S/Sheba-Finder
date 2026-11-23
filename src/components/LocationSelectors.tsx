import { useMemo } from 'react';
import { BANGLADESH_GEO } from '../data/bangladeshGeo';
import { useApp } from '../context/AppContext';

interface LocationSelectorsProps {
  division: string;
  district: string;
  upazila: string;
  onDivisionChange: (value: string) => void;
  onDistrictChange: (value: string) => void;
  onUpazilaChange: (value: string) => void;
  includeAllOption?: boolean;
  required?: boolean;
  layout?: 'row' | 'stack';
}

export function LocationSelectors({
  division,
  district,
  upazila,
  onDivisionChange,
  onDistrictChange,
  onUpazilaChange,
  includeAllOption = true,
  required = false,
  layout = 'row',
}: LocationSelectorsProps) {
  const { language, t, customLocations } = useApp();

  const mergedGeo = useMemo(() => {
    const divisions = BANGLADESH_GEO.map((div) => ({
      en: div.en,
      bn: div.bn,
      districts: div.districts.map((dist) => ({
        en: dist.en,
        bn: dist.bn,
        upazilas: [...dist.upazilas],
      })),
    }));

    for (const loc of customLocations) {
      if (!loc.active) continue;
      let div = divisions.find(
        (d) => d.en.toLowerCase() === loc.divisionEn.toLowerCase()
      );
      if (!div) {
        div = { en: loc.divisionEn, bn: loc.divisionBn, districts: [] };
        divisions.push(div);
      }
      let dist = div.districts.find(
        (dt) => dt.en.toLowerCase() === loc.districtEn.toLowerCase()
      );
      if (!dist) {
        dist = { en: loc.districtEn, bn: loc.districtBn, upazilas: [] };
        div.districts.push(dist);
      }
      if (
        !dist.upazilas.some(
          (u) => u.en.toLowerCase() === loc.upazilaEn.toLowerCase()
        )
      ) {
        dist.upazilas.push({ en: loc.upazilaEn, bn: loc.upazilaBn });
      }
    }

    return divisions;
  }, [customLocations]);

  const activeDivision = mergedGeo.find((d) => d.en === division);
  const availableDistricts = activeDivision ? activeDivision.districts : [];
  const activeDistrict = availableDistricts.find((d) => d.en === district);
  const availableUpazilas = activeDistrict ? activeDistrict.upazilas : [];

  const selectBase =
    'min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none dark:border-slate-700 dark:bg-[#0B1120] dark:text-slate-100 dark:focus:border-blue-500';

  return (
    <div
      className={
        layout === 'row'
          ? 'grid grid-cols-1 gap-2.5 sm:grid-cols-3'
          : 'grid grid-cols-1 gap-3 sm:grid-cols-3'
      }
    >
      <div>
        <label className="sr-only" htmlFor="loc-division">
          {language === 'bn' ? 'বিভাগ' : 'Division'}
        </label>
        <select
          id="loc-division"
          required={required}
          value={division}
          onChange={(e) => {
            onDivisionChange(e.target.value);
            onDistrictChange('');
            onUpazilaChange('');
          }}
          className={selectBase}
        >
          <option value="">
            {includeAllOption
              ? t.allDivisions
              : language === 'bn'
                ? 'বিভাগ নির্বাচন করুন'
                : 'Select Division'}
          </option>
          {mergedGeo.map((div) => (
            <option key={div.en} value={div.en}>
              {language === 'bn' ? `${div.bn} (${div.en})` : div.en}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="loc-district">
          {language === 'bn' ? 'জেলা' : 'District'}
        </label>
        <select
          id="loc-district"
          required={required}
          disabled={!division}
          value={district}
          onChange={(e) => {
            onDistrictChange(e.target.value);
            onUpazilaChange('');
          }}
          className={`${selectBase} disabled:cursor-not-allowed disabled:opacity-55`}
        >
          <option value="">
            {includeAllOption
              ? t.allDistricts
              : language === 'bn'
                ? 'জেলা নির্বাচন করুন'
                : 'Select District'}
          </option>
          {availableDistricts.map((dist) => (
            <option key={dist.en} value={dist.en}>
              {language === 'bn' ? `${dist.bn} (${dist.en})` : dist.en}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="sr-only" htmlFor="loc-upazila">
          {language === 'bn' ? 'উপজেলা / থানা' : 'Upazila / Thana'}
        </label>
        <select
          id="loc-upazila"
          required={required}
          disabled={!district}
          value={upazila}
          onChange={(e) => onUpazilaChange(e.target.value)}
          className={`${selectBase} disabled:cursor-not-allowed disabled:opacity-55`}
        >
          <option value="">
            {includeAllOption
              ? t.allUpazilas
              : language === 'bn'
                ? 'উপজেলা নির্বাচন করুন'
                : 'Select Upazila'}
          </option>
          {availableUpazilas.map((up) => (
            <option key={up.en} value={up.en}>
              {language === 'bn' ? `${up.bn} (${up.en})` : up.en}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

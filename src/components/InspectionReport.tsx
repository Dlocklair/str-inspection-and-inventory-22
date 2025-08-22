import { ChecklistSection } from './ChecklistSection';

export const InspectionReport = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Inspection Reports
        </h1>
        <p className="text-muted-foreground">
          Manage property inspection checklists and records
        </p>
      </div>
      <ChecklistSection />
    </div>
  );
};
export interface KpiData {
  id: string;
  icon: React.ComponentType<{ className?: string, size?: number, strokeWidth?: number }>;
  iconBgColor: string;
  iconColor: string;
  value: string;
  label: string;
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  timeAgo: string;
}

export interface ExpiringContract {
  id: string;
  name: string;
  department: string;
  daysLeft: number;
}



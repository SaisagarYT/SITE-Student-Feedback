"use client"
import { LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";



type LineChartData = { date: string; count: number }[];
type BarChartData = { rating: string | number; percent: number }[];

interface ChartBlockProps {
  type: "line" | "bar";
  data: LineChartData | BarChartData;
}

export default function ChartBlock({ type, data }: ChartBlockProps) {
  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-400">No data available</div>;
  }
  if (type === "line") {
    return (
      <LineChart width={400} height={250} data={data as LineChartData}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line dataKey="count" />
      </LineChart>
    );
  }
  return (
    <BarChart width={400} height={250} data={data as BarChartData}>
      <XAxis dataKey="rating" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="percent" />
    </BarChart>
  );
}

import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartTypeBarProps {
  data: Record<string, unknown>[];
  dataKey: string;
}

const ChartTypeBar = ({ data, dataKey }: ChartTypeBarProps) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={dataKey} fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ChartTypeBar;

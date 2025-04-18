import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const ChartTypePie = ({ data, dataKey }) => {
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a4de6c", "#d0ed57", "#8dd1e1"];

  return (
    <PieChart width={350} height={250}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        outerRadius={80}
        fill="#8884d8"
        dataKey={dataKey}
        label
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
};

export default ChartTypePie;

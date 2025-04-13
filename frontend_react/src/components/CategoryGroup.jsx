import React from "react";
import { CategoryEditor } from "./CategoryEditor";

export const CategoryGroup = ({ type, data, setData }) => {
  const categories = Object.keys(data).sort((a, b) => {
    if (a === "其他") return 1;
    if (b === "其他") return -1;
    return 0;
  });

  const handleRename = (oldName, newName) => {
    const updated = { ...data };
    updated[newName] = updated[oldName];
    delete updated[oldName];
    setData((prev) => ({
      ...prev,
      classifications: {
        ...prev.classifications,
        [type]: updated,
      },
    }));
  };

  const handleDelete = (name) => {
    const updated = { ...data };
    delete updated[name];
    setData((prev) => ({
      ...prev,
      classifications: {
        ...prev.classifications,
        [type]: updated,
      },
    }));
  };

  return (
    <div>
      {categories.map((cat) => (
        <CategoryEditor
          key={cat}
          categoryName={cat}
          keywords={data[cat]}
          allCategories={categories}
          onRename={handleRename}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import MainLayout from "../components/layout/MainLayout";

const PrivacyPolicyPage = () => {
  const [markdown, setMarkdown] = useState("");

  useEffect(() => {
    fetch("/privacy_policy.md")
      .then((res) => res.text())
      .then((text) => setMarkdown(text));
  }, []);

  return (
    <MainLayout>
    <div className="max-w-3xl mx-auto p-6 text-gray-800 dark:text-gray-100">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-semibold mt-6 mb-2" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-relaxed" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside mb-4" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="mb-1" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-blue-600 underline" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold" {...props} />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
    </MainLayout>
  );
};

export default PrivacyPolicyPage;

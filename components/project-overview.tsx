import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const RAGvisionRAGPipeline = () => (
  <motion.div
    className="w-full max-w-[600px] my-4"
    initial={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.5 }}
  >
    <div className="border rounded-lg p-6 flex flex-col gap-4 text-neutral-500 text-sm dark:text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900">
      <h1 className="text-xl font-bold">RAG Vision</h1>
      <p>
        This project leverages the{" "}
        <Link
          href="https://www.kaggle.com/datasets/jrobischon/wikipedia-movie-plots"
          className="text-blue-500"
          target="_blank"
        >
          Wikipedia Movie Plot Dataset
        </Link>{" "}
        to build a robust Retrieval Augmented Generation (RAG) pipeline. The objective is straightforward: answer queries accurately using a Hugging Face model by integrating retrieval and generation techniques.
      </p>
    </div>
  </motion.div>
);

export default RAGvisionRAGPipeline;

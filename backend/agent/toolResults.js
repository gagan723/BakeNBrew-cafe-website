function toolData(result) {
  const structured = result?.structuredContent;
  if (structured !== undefined) {
    return structured && Object.prototype.hasOwnProperty.call(structured, "result")
      ? structured.result
      : structured;
  }
  const text = result?.content?.find((part) => part.type === "text")?.text;
  try { return JSON.parse(text); } catch { return text || {}; }
}

function assertToolSuccess(result) {
  if (result?.isError) {
    const error = new Error(result.content?.[0]?.text || "The cafe tool could not complete that request");
    error.code = "MCP_TOOL_ERROR";
    throw error;
  }
  return toolData(result);
}

module.exports = { toolData, assertToolSuccess };

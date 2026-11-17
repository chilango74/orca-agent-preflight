/** @param {string} value */
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'"

/**
 * Keep preparation context separate from the agent's environment, and guard
 * the entire original command, including compound commands and comments.
 * @param {string} workspace
 * @param {string} preparation
 * @param {string} original
 */
export const guardedCommand = (workspace, preparation, original) =>
  '(\nexport PREFLIGHT_WORKSPACE=' + quote(workspace) + '\n' + preparation +
  '\n) && (\n' + original + '\n)'

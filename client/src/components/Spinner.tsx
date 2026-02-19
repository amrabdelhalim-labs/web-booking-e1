/**
 * Loading Spinner Component
 *
 * Displays a centered loading animation using react-loader-spinner.
 * Used during async operations like data fetching.
 *
 * TODO: Implement full spinner (Phase 5.2)
 */

import { Puff } from "react-loader-spinner";

export default function Spinner() {
  return (
    <div className="d-flex justify-content-center">
      <Puff color="#cc6600" height={100} width={100} />
    </div>
  );
}

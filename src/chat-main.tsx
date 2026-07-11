/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import YaamaaChatStandaloneApp from './components/YaamaaChatStandaloneApp.tsx';
import './index.css';

createRoot(document.getElementById('chat-root')!).render(
  <StrictMode>
    <YaamaaChatStandaloneApp />
  </StrictMode>
);

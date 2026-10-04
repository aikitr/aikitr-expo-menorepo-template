import React, { type ReactNode } from 'react';
import '@taroify/core/button/style';
import { ThemeProvider } from '@/providers/theme-provider';
import './app.scss';

function App({ children }: { readonly children?: ReactNode }) {
  return React.createElement(ThemeProvider, null, children);
}

export default App;

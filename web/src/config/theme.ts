import { theme as antTheme } from 'antd';
import type { ThemeConfig } from 'antd';

export const themeConfig: Omit<ThemeConfig, 'algorithm'> = {
  token: {
    colorPrimary: '#2f81f7',
    colorInfo: '#58a6ff',
    colorSuccess: '#3fb950',
    colorWarning: '#d29922',
    colorError: '#f85149',
    colorLink: '#58a6ff',
    colorBgBase: '#0d1117',
    colorBgLayout: '#0d1117',
    colorBgContainer: '#161b22',
    colorBgElevated: '#21262d',
    colorBorder: '#30363d',
    colorBorderSecondary: '#30363d',
    colorText: '#c9d1d9',
    colorTextSecondary: '#8b949e',
    colorTextTertiary: '#6e7681',
    borderRadius: 8,
    fontFamily: 'Manrope, "Segoe UI", Arial, sans-serif',
  },
  components: {
    Layout: {
      headerBg: '#161b22',
      bodyBg: '#0d1117',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: '#8b949e',
      itemSelectedColor: '#c9d1d9',
      itemSelectedBg: '#21262d',
      itemHoverColor: '#c9d1d9',
      itemHoverBg: '#1f2630',
    },
    Card: {
      colorBgContainer: '#161b22',
    },
    Table: {
      headerBg: '#161b22',
      headerColor: '#c9d1d9',
      colorBgContainer: '#161b22',
      borderColor: '#30363d',
      rowHoverBg: '#1f2630',
    },
  },
};

export { antTheme };

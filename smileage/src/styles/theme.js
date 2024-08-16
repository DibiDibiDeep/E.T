import { createTheme } from '@mui/material/styles';
import { amber, grey } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: amber[700],
      light: amber[50]
    },
    secondary: {
      main: grey[800],
    },
  },
});

export default theme
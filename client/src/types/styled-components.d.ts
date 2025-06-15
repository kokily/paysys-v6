import 'styled-components';

export interface CustomTheme {
  colors: {
    member: string;
    associate: string;
    general: string;
  };
}

declare module 'styled-components' {
  export interface DefaultTheme extends CustomTheme {}
}

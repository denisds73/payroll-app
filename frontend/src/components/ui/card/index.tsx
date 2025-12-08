import { Card } from './Card';
import { CardContent } from './CardContent';
import { CardDescription } from './CardDescription';
import { CardFooter } from './CardFooter';
import { CardHeader } from './CardHeader';
import { CardTitle } from './CardTitle';

type CardComponent = typeof Card & {
  Header: typeof CardHeader;
  Title: typeof CardTitle;
  Description: typeof CardDescription;
  Content: typeof CardContent;
  Footer: typeof CardFooter;
};

const CardWithSubcomponents = Card as CardComponent;
CardWithSubcomponents.Header = CardHeader;
CardWithSubcomponents.Title = CardTitle;
CardWithSubcomponents.Description = CardDescription;
CardWithSubcomponents.Content = CardContent;
CardWithSubcomponents.Footer = CardFooter;

export { CardWithSubcomponents as Card };

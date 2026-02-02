import { Button } from '@/components/ui/button';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'hopz' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

// Add hopz variant to existing button component
const buttonVariants = {
    hopz: 'bg-gradient-pink-cyan text-primary-foreground hover:opacity-90 rounded-full shadow-pink',
};

export { Button, buttonVariants };

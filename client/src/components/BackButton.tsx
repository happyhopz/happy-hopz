import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
    label?: string;
    to?: string;
    className?: string;
}

const BackButton = ({ label = 'Back', to, className }: BackButtonProps) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (to) {
            navigate(to);
        } else {
            navigate(-1);
        }
    };

    return (
        <Button
            variant="ghost"
            onClick={handleClick}
            className={`mb-4 hover:bg-secondary/50 ${className || ''}`}
        >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {label}
        </Button>
    );
};

export default BackButton;

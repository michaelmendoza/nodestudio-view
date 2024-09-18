
export const Button = ({children, onClick, className = 'button-primary'}) => {
    return (<button className={className} onClick={onClick}>{children}</button>)
}
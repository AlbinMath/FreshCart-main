import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/ui/button';

const Navbar = ({ showRegisterButton = true }) => {
    return (
        <header className="bg-white border-b py-4 px-6 md:px-12 flex items-center justify-between shadow-sm">
            <Link to="/" className="flex items-center gap-2 text-green-600 font-bold text-2xl">
                <ShoppingCart className="h-8 w-8" />
                <span>FreshCart</span>
            </Link>
            <div className="flex items-center gap-4">
                {showRegisterButton ? (
                    <>
                        <span className="text-sm text-gray-500 hidden sm:inline">New to FreshCart?</span>
                        <a
                            href="https://fresh-cart-seller-registrations-m7e.vercel.app/seller-registration"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button className="bg-green-600 hover:bg-green-700 text-white font-medium">
                                Register
                            </Button>
                        </a>
                    </>
                ) : (
                    <>
                        <span className="text-sm text-gray-500 hidden sm:inline">Already have an account?</span>
                        <Link to="/seller-login">
                            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 font-medium">
                                Sign In
                            </Button>
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
};

export default Navbar;

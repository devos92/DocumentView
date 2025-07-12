import React from 'react';

const PasswordRules = ({ password }) => {
    const rules = [
        { id: 'length', text: 'At least 8 characters long', test: (password) => password.length >= 8 },
        { id: 'uppercase', text: 'Contains at least 1 uppercase letter', test: (password) => /[A-Z]/.test(password) },
        { id: 'number', text: 'Contains at least 1 number', test: (password) => /\d/.test(password) },
        { id: 'specialChar', text: 'Contains at least 1 special character', test: (password) => /[\W_]/.test(password) },
        { id: 'noSpaces', text: 'Does not contain any spaces', test: (password) => !/\s/.test(password) }
    ];

    return (
        <div>
            <ul className="list-none pl-0 text-sm text-neutral">
                {rules.map(rule => (
                    <li key={rule.id} className={`flex justify-between items-center ${rule.test(password) ? 'text-green-500' : 'text-red-500'}`}>
                        {rule.text}
                        {rule.test(password) ? (
                            <span>✓</span>
                        ) : (
                            <span>✗</span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PasswordRules;

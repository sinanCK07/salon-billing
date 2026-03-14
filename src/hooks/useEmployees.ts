import { useState, useEffect } from 'react';

export interface Employee {
    id: string;
    name: string;
}

const INITIAL_EMPLOYEES: Employee[] = [
    { id: '1', name: 'ANSHIF' },
    { id: '2', name: 'ADHIL' },
    { id: '3', name: 'ASWIN' },
    { id: '4', name: 'SHAHAD' },
    { id: '5', name: 'SHAHAL' },
    { id: '6', name: 'SHAMEEM' },
];

export const useEmployees = () => {
    const [employees, setEmployees] = useState<Employee[]>(() => {
        const saved = localStorage.getItem('salon_employees');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse employees', e);
            }
        }
        return INITIAL_EMPLOYEES;
    });

    useEffect(() => {
        localStorage.setItem('salon_employees', JSON.stringify(employees));
    }, [employees]);

    const addEmployee = (name: string) => {
        const newEmployee: Employee = {
            id: Date.now().toString(),
            name: name.trim().toUpperCase(),
        };
        setEmployees(prev => [...prev, newEmployee]);
    };

    const removeEmployee = (id: string) => {
        setEmployees(prev => prev.filter(emp => emp.id !== id));
    };

    return {
        employees,
        addEmployee,
        removeEmployee
    };
};

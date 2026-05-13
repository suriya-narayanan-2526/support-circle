import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ROLES } from '../../utils/constants';
import { supabase } from '../../lib/supabase';

const partnerSchema = z.object({
  fullName: z.string().min(2, 'Representative name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  institutionType: z.enum(['School', 'College', 'Corporate', 'Other']),
  institutionName: z.string().min(2, 'Institution name is required'),
  location: z.string().min(5, 'Address is required'),
});

export const RegisterPartnerForm = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      institutionType: 'School',
    }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const { data: authData, error: authError } = await signUp(data.email, data.password, {
        full_name: data.fullName,
        role: ROLES.PARTNER,
      });

      if (authError) throw authError;

      await supabase.from('users').insert({
        id: authData.user.id,
        email: data.email,
        full_name: data.fullName,
        role: ROLES.PARTNER,
      });

      // Insert into partners table
      const { error: partnerError } = await supabase.from('partners').insert({
        user_id: authData.user.id,
        institution_name: data.institutionName,
        institution_type: data.institutionType,
        location: data.location,
        is_verified: false,
      });

      if (partnerError) throw partnerError;

      toast.success('Registration successful! Please log in pending verification.');
      navigate('/auth/login');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Impact Side */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="hidden lg:flex flex-col justify-center space-y-8 pr-8"
          >
            <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-800 w-max">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
              Institutional Partnership
            </div>
            
            <h1 className="font-display text-4xl leading-tight font-bold text-navy sm:text-5xl">
              Empower your students to <span className="text-blue-600">give back</span>.
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed max-w-md">
              Register your school or college to coordinate large-scale donation drives, engage your student body in community service, and build a culture of genuine empathy.
            </p>

            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="border border-gray-100 bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 bg-blue-100 text-blue-600 flex items-center justify-center rounded-xl mb-4 text-xl">🎓</div>
                <h4 className="font-bold text-navy text-sm">Student Engagement</h4>
                <p className="text-xs text-gray-500 mt-1">Easily track and organize volunteering hours.</p>
              </div>
              <div className="border border-gray-100 bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 bg-amber/10 text-amber-600 flex items-center justify-center rounded-xl mb-4 text-xl">🏆</div>
                <h4 className="font-bold text-navy text-sm">Recognize Impact</h4>
                <p className="text-xs text-gray-500 mt-1">Showcase your institution's contribution leaderboard.</p>
              </div>
            </div>
          </motion.div>

          {/* Right Form Side */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="w-full p-8 shadow-xl border-t-4 border-t-blue-500 sm:p-10">
              <div className="text-center lg:text-left mb-8">
                <h2 className="font-display text-2xl font-bold text-navy">Partner With Us</h2>
                <p className="mt-2 text-sm text-gray-500">For schools, colleges, and local organizations.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-gray-100 pb-2">Primary Contact</h3>
                  <Input label="Full Name" placeholder="e.g. Professor Smith" {...register('fullName')} error={errors.fullName?.message} />
                  <Input label="Official Email" type="email" placeholder="contact@university.edu" {...register('email')} error={errors.email?.message} />
                  <Input label="Secure Password" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 border-b border-gray-100 pb-2">Institution Details</h3>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-navy">Institution Type</label>
                    <select 
                      className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-navy outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      {...register('institutionType')}
                    >
                      <option value="School">School</option>
                      <option value="College">College</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.institutionType && <p className="text-xs text-red-500">{errors.institutionType.message}</p>}
                  </div>

                  <Input label="Institution Name" placeholder="e.g. Springfield High School" {...register('institutionName')} error={errors.institutionName?.message} />
                  <Input label="City / Region" placeholder="e.g. New York, NY" {...register('location')} error={errors.location?.message} />
                </div>

                <div className="pt-6">
                  <Button type="submit" fullWidth size="lg" className="bg-navy hover:bg-slate-800 text-white font-bold tracking-wide shadow-lg shadow-navy/20" isLoading={isSubmitting}>
                    Register Institution
                  </Button>
                </div>
              </form>

              <div className="mt-8 text-center bg-gray-50 -mx-8 -my-8 p-6 pb-8 border-t border-gray-100 sm:-mx-10 mt-10">
                <p className="text-sm text-gray-600">
                  Are you a private donor or volunteer? <br className="sm:hidden" />
                  <Link to="/auth/register" className="font-semibold text-blue-600 hover:underline ml-1">View other roles &rarr;</Link>
                </p>
              </div>
            </Card>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

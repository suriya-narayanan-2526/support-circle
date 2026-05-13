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
import { FiBriefcase, FiUser, FiMail, FiLock, FiHome, FiMapPin, FiBarChart2, FiImage, FiArrowRight, FiShield } from 'react-icons/fi';

const orphanageSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid business email'),
  password: z.string().min(6, 'Minimum 6 characters'),
  orphanageName: z.string().min(2, 'Organization name is required'),
  location: z.string().min(5, 'Address is required'),
  capacity: z.number({ invalid_type_error: 'Numeric value required' }).min(1, 'Capacity must be >= 1'),
});

export const RegisterOrphanageForm = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(orphanageSchema),
  });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const { data: authData, error: authError } = await signUp(data.email, data.password, {
        full_name: data.fullName,
        role: ROLES.ORPHANAGE,
        orphanage_name: data.orphanageName,
        location: data.location,
        capacity: data.capacity,
        photo_url: imagePreview // Store as Base64 string directly
      });
      if (authError) throw authError;

      await Promise.all([
        supabase.from('users').insert({ id: authData.user.id, email: data.email, full_name: data.fullName, role: ROLES.ORPHANAGE }),
        supabase.from('orphanages').insert({ user_id: authData.user.id, name: data.orphanageName, location: data.location, capacity: data.capacity, image_url: imagePreview })
      ]);

      toast.success('Registration submitted for verification.');
      navigate('/auth/login');
    } catch (error) { 
      console.error('Registration failed:', error);
      toast.error(error.message || 'Submission failed'); 
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div style={{ background: 'radial-gradient(circle at 100% 0%, rgba(232,98,42,0.05) 0%, transparent 40%)' }} className="absolute inset-0 pointer-events-none" />
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block space-y-10 pr-10">
            <div className="inline-flex items-center gap-3 bg-orange-50 border border-orange-100 px-4 py-1.5 rounded-full text-[10px] font-black text-[#E8622A] tracking-widest uppercase">
              Organization Partner Program
            </div>
            <h1 className="text-5xl font-bold text-stone-900 leading-tight tracking-tight">
              Scaling Community <br /><span className="text-[#E8622A]">Resilience</span> Together.
            </h1>
            <p className="text-lg text-stone-500 font-medium leading-relaxed">
              Register your organization to gain verified access to the direct donation network and resource management tools.
            </p>
            <div className="space-y-8 pt-4">
               {[ { i: FiShield, t: 'Verified Partner Status', d: 'Secure your organizational profile within our trusted network.' }, { i: FiBarChart2, t: 'Resource Analytics', d: 'Track your incoming allocations and manage child capacity protocols.' } ].map((item, idx) => (
                 <div key={idx} className="flex gap-6 items-start">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#E8622A] border border-stone-100 shadow-sm"><item.i size={20} /></div>
                    <div><h4 className="text-stone-900 font-bold text-sm uppercase tracking-tight">{item.t}</h4><p className="text-xs text-stone-500 mt-1">{item.d}</p></div>
                 </div>
               ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-8 md:p-12 shadow-2xl border-t-4 border-t-[#E8622A] rounded-[24px]">
              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-stone-900">Partner Application</h2>
                <p className="text-stone-500 text-xs mt-1 font-bold uppercase tracking-widest">Operational Enrollment Terminal</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-[#E8622A] border-b border-stone-100 pb-3"><FiUser /><span className="text-[10px] font-black uppercase tracking-widest">Lead Representative</span></div>
                  <Input label="Full Name" placeholder="Jane Smith" {...register('fullName')} error={errors.fullName?.message} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Professional Email" type="email" placeholder="director@entity.org" {...register('email')} error={errors.email?.message} />
                    <Input label="Access Key" type="password" placeholder="••••••••" {...register('password')} error={errors.password?.message} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-[#E8622A] border-b border-stone-100 pb-3"><FiBriefcase /><span className="text-[10px] font-black uppercase tracking-widest">Organizational Specs</span></div>
                  
                  <div className="flex items-center gap-6 bg-stone-50 p-6 rounded-2xl border border-stone-100 group">
                    <div className="w-20 h-20 rounded-xl border border-stone-200 overflow-hidden bg-white flex-shrink-0 shadow-sm">
                      {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-200"><FiImage size={24} /></div>}
                    </div>
                    <div className="flex-1">
                       <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3">Profile Portrait</p>
                       <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-[10px] text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#E8622A]/10 file:text-[#E8622A] file:font-bold cursor-pointer" />
                    </div>
                  </div>

                  <Input label="Registered Entity Name" placeholder="Hope Children's Home" {...register('orphanageName')} error={errors.orphanageName?.message} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Operating Base" placeholder="Street, District" {...register('location')} error={errors.location?.message} />
                    <Input label="Personnel Capacity" type="number" placeholder="50" {...register('capacity', { valueAsNumber: true })} error={errors.capacity?.message} />
                  </div>
                </div>

                <Button type="submit" fullWidth className="py-5 bg-[#E8622A] hover:bg-[#C4521F] text-white font-bold text-sm tracking-wide rounded-xl shadow-lg transition-all" isLoading={isSubmitting}>
                   Submit Application <FiArrowRight className="ml-2" />
                </Button>
              </form>

              <div className="mt-10 text-center pt-8 border-t border-stone-100">
                <p className="text-xs text-stone-500 font-bold uppercase tracking-widest">
                  Not an organization? <Link to="/auth/register" className="text-[#E8622A] hover:underline ml-2">Alternative Roles &rarr;</Link>
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

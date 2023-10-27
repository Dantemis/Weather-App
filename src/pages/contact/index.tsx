import React, { useState } from "react";
import Layout from "~/components/Layout";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { Id, toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/lib/utils/api";

const ContactUs = () => {
  const { t: translationContact } = useTranslation("contact");
  const { t: translationCommon } = useTranslation("common");

  const [toastId, setToastId] = useState<Id>("");

  const ContactValidator = z.object({
    firstName: z
      .string()
      .min(2, { message: translationContact("at least 2 characters") })
      .max(50),
    lastName: z
      .string()
      .min(2, { message: translationContact("at least 2 characters") })
      .max(50),
    email: z.string().email({ message: translationContact("invalid email") }),
    message: z
      .string()
      .min(10, { message: translationContact("at least 10 characters") })
      .max(500),
    // This is a honeypot to prevent spam
    testMessage: z.string().max(0),
  });

  type ContactValidatorType = z.infer<typeof ContactValidator>;

  const mutation = api.email.sendContactEmail.useMutation({
    onMutate: () => {
      let toastIdTmp = toast(
        translationContact("sending email loading toast"),
        {
          autoClose: false,
          isLoading: true,
        },
      );
      setToastId(toastIdTmp);
    },

    onSuccess: () => {
      toast.dismiss(toastId);
      reset();
      toast.success(translationContact("sent toast"));
    },
  });

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
    reset,
  } = useForm<ContactValidatorType>({
    resolver: zodResolver(ContactValidator),
  });

  return (
    <>
      <ToastContainer />
      <Layout title={translationCommon("menu contact")}>
        <div className="flex w-full flex-col items-center">
          <h1 className="mt-10 flex justify-center text-4xl font-bold">
            {translationCommon("menu contact")}
          </h1>
          <hr className="mt-3 h-1.5 w-6/12 rounded bg-[#2d3142] md:w-4/12" />
          <form
            onSubmit={handleSubmit(() => {
              mutation.mutate(getValues());
            })}
            className="flex w-full flex-col items-center"
          >
            <div className="mb-2 ml-5 mr-5 mt-5 flex flex-col md:w-1/3 md:flex-row">
              <div className="mb-2 flex w-60 flex-col md:mb-0 md:mr-4 md:w-full">
                {errors.firstName && (
                  <p className="text-red-500">{errors.firstName.message}</p>
                )}
                <label className="ml-2">
                  {translationContact("first name")}
                </label>
                <input
                  className="h-10 w-full rounded-md bg-[#d7d5db] pl-2"
                  autoFocus
                  {...register("firstName")}
                />
              </div>
              <div className="flex w-60 flex-col md:w-full">
                {errors.lastName && (
                  <p className="text-red-500">{errors.lastName.message}</p>
                )}
                <label className="ml-2">
                  {translationContact("last name")}
                </label>
                <input
                  className="h-10 w-full rounded-md bg-[#d8d5db] pl-2"
                  {...register("lastName")}
                />
              </div>
            </div>
            <div className="mb-2 flex w-60 flex-col md:w-4/12">
              {errors.email && (
                <p className="text-red-500">{errors.email.message}</p>
              )}
              <label className="ml-2">{translationContact("email")}</label>
              <input
                className="h-10 w-full rounded-md bg-[#d8d5db] pl-2"
                {...register("email")}
              />
            </div>
            <div className="mb-8 flex w-60 flex-col md:w-4/12">
              {errors.message && (
                <p className="text-red-500">{errors.message.message}</p>
              )}
              <label className="ml-2">{translationContact("message")}</label>
              <textarea
                className="h-64 w-full resize-none rounded-md bg-[#d8d5db] pl-2"
                {...register("message")}
              />
            </div>
            <input className="hidden" {...register("testMessage")} />
            <button className="h-9 w-60 rounded border-solid bg-[#2d3142] font-bold text-white">
              <div>{translationContact("send button")}</div>
            </button>
          </form>
        </div>
      </Layout>
    </>
  );
};

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["contact", "common"])),
    },
  };
}

export default ContactUs;
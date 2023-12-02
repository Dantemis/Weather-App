import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Image from "next/image";
import { activeCity$, addedCities$ } from "~/states";
import { toast, ToastContainer } from "react-toastify";
import search1Image from "~/assets/search1.png";
import background from "~/assets/background.png";
import "react-toastify/dist/ReactToastify.css";
import { type ICity } from "~/types";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { api } from "~/lib/utils/api";

const Search = () => {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState<ICity>({
    id: 0,
    name: "",
    country: "",
    region: "",
    coord: {
      lon: 0,
      lat: 0,
    },
  }); // searchValue is the value of the input field
  const [results, setResults] = useState<ICity[]>([]); // results is the list of cities that match the searchValue
  const [isInputActive, setIsInputActive] = useState<boolean>(true); // this looks if the input field is active
  const inputRef = useRef<HTMLInputElement>(null); // inputRef is the ref of the input field

  const { t: translationCommon } = useTranslation("common");
  const { t: translationSearch } = useTranslation("search");
  const { t: translationLocationSettings } = useTranslation("locationsettings");

  /*
  Fetches on every change in the search Value the cities that match the search value
   */
  const { data: findCitiesByNameData = [], status: findCitiesByNameStatus } =
    api.search.findCitiesByName.useQuery({
      name: searchValue.name,
    });

  const { data: findCityByIdData = [], status: findCityByIdStatus } =
    api.search.findCityById.useQuery({
      id: searchValue.id,
    });

  const { data: findCityByNameData = [], status: findCityByNameStatus } =
    api.search.findCityByName.useQuery({
      name: searchValue.name,
    });

  useEffect(() => {
    if (searchValue.name === "") {
      setResults([]);
      return;
    }
    if (!findCitiesByNameData || findCitiesByNameStatus !== "success") return;
    setResults(findCitiesByNameData);
  }, [searchValue, findCitiesByNameData, findCitiesByNameStatus]);

  // Gets called if the user clicks on the "continue" button or press enter
  const searchCity = () => {
    let city: ICity | undefined = {
      id: 0,
      name: "",
      country: "",
      region: "",
      coord: {
        lon: 0,
        lat: 0,
      },
    };
    if (searchValue.id === -1) {
      city = {
        id: -1,
        name: searchValue.name,
        country: "",
        region: "",
        coord: {
          lon: searchValue.coord.lon,
          lat: searchValue.coord.lat,
        },
      };
    } else {
      if (searchValue.id !== 0 && searchValue.country !== "") {
        console.log("hi");
        if (findCityByIdStatus === "loading") {
          toast.error(translationLocationSettings("try again toast"));
          return;
        }
        if (!Array.isArray(findCityByIdData)) {
          city = findCityByIdData.city;
        } else {
          toast.error(translationLocationSettings("city not found toast"));
          return;
        }
      } else {
        console.log("hi");
        if (findCityByNameStatus === "loading") {
          toast.error(translationLocationSettings("try again toast"));
          return;
        }
        console.log("hi 2");
        if (!Array.isArray(findCityByNameData)) {
          console.log("hi 3");
          city = findCityByNameData.city;
        } else {
          toast.error(translationLocationSettings("city not found toast"));
          return;
        }
      }
    }

    if (city) {
      if (addedCities$.get().find((value: ICity) => value.id === city!.id)) {
        activeCity$.set(city);
        void router.push("/home");
      } else {
        addedCities$.push(city);
        activeCity$.set(city);
        void router.push("/home");
      }
    } else {
      toast.error(translationLocationSettings("city not found toast"));
    }
  };

  return (
    <>
      <ToastContainer />
      <Head>
        <title>{translationCommon("search page title")}</title>
        <meta name="description" content="An faboulus weather website" />
      </Head>
      <Image
        src={background}
        alt="background"
        className="-z-10 object-cover"
        fill
      />
      <div className="flex w-full items-center justify-center">
        <div
          id="styles-setup"
          className="mt-80 flex w-9/12 justify-center border-8 border-solid border-[#2d3142] md:w-6/12"
        >
          <Image
            className="transform bg-[#383b53] pb-1.5 pl-1.5 pt-1.5 md:w-12 md:pb-3 md:pl-3 md:pt-3"
            src={search1Image}
            alt="search-icon"
            width={40}
            height={40}
          />

          <input
            className="w-full bg-[#383b53] pl-1.5 text-xl text-white outline-none md:pb-0.5 md:pl-3 md:pt-0.5"
            autoFocus
            placeholder={translationSearch("search input placeholder")}
            type="text"
            onFocus={() => {
              setIsInputActive(true);
            }}
            value={searchValue.name}
            onBlur={() => {
              setIsInputActive(false);
            }}
            onChange={(event) => {
              setSearchValue((prevSearchValue): ICity => {
                return {
                  ...prevSearchValue,
                  id: 0,
                  name: event.target.value,
                };
              });
            }}
            ref={inputRef}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                searchCity();
              }
            }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center">
        {results.map((city: ICity) => {
          if (
            isInputActive &&
            city.name.toLowerCase().startsWith(searchValue.name.toLowerCase())
          ) {
            return (
              <div
                className={
                  isInputActive
                    ? "z-20 flex h-auto w-9/12 cursor-pointer justify-between border-b-2 border-gray-400 bg-[#383b53] p-5 text-amber-50 md:w-6/12"
                    : "hidden"
                }
                key={city.id}
                onMouseDown={() => {
                  setSearchValue((prevSearchValue): ICity => {
                    return {
                      ...prevSearchValue,
                      id: city.id,
                      name: city.name,
                      country: city.country,
                      region: city.region,
                      coord: {
                        lon: city.coord.lon,
                        lat: city.coord.lat,
                      },
                    };
                  });
                  setIsInputActive(false);
                  inputRef.current?.blur();
                }}
              >
                <p>
                  {city.name
                    .split("")
                    .map((letter: string, letterIndex: number) => (
                      <span
                        className={
                          letterIndex < searchValue.name.length
                            ? "font-bold"
                            : ""
                        }
                        key={letterIndex}
                      >
                        {letter}
                      </span>
                    ))}
                </p>
                {city.country}
              </div>
            );
          }
        })}
        <div className="mt-12 flex h-1/6 w-full justify-center md:transform">
          <div className="flex w-max flex-col items-center gap-4">
            <button
              className="z-10 w-full rounded border-2 bg-white p-2 pb-2 pt-2 text-2xl text-[#2d3142] transition duration-500 ease-in-out hover:shadow-2xl"
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    const city: ICity = {
                      id: -1,
                      name: translationCommon("my city"),
                      country: "",
                      region: "",
                      coord: {
                        lon: longitude,
                        lat: latitude,
                      },
                    };

                    setSearchValue(city);
                  });
                }
              }}
            >
              {translationSearch("my city button")}
            </button>
            {searchValue.name.length > 0 ? (
              <button
                onClick={() => {
                  searchCity();
                }}
                className="z-10 flex h-12 w-full items-center justify-center rounded border-2 border-black bg-[#2d3142] p-2 text-2xl text-white transition duration-500 ease-in-out hover:shadow-2xl"
              >
                <p>{translationSearch("continue button")}</p>
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
};

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        "common",
        "search",
        "locationsettings",
      ])),
    },
  };
}

export default Search;

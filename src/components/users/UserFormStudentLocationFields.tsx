import {
  type UseFormRegister,
  type FieldErrors,
  type UseFormSetValue,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { BR_STATES } from "@/lib/br-locations";
import { COMMON_COUNTRIES } from "@/lib/countries";
import type { BrCityOption } from "@/lib/br-locations";
import { ui } from "@/content";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFormData = any;

interface UserFormStudentLocationFieldsProps {
  register: UseFormRegister<AnyFormData>;
  errors: FieldErrors<AnyFormData>;
  setValue: UseFormSetValue<AnyFormData>;
  isLoading: boolean;
  isBrazilSelected: boolean;
  selectedCountry: string;
  setSelectedCountry: (v: string) => void;
  selectedState: string;
  setSelectedState: (v: string) => void;
  cities: BrCityOption[];
  isLoadingCities: boolean;
  watchedCity: string;
  countryPopoverOpen: boolean;
  setCountryPopoverOpen: (v: boolean) => void;
  statePopoverOpen: boolean;
  setStatePopoverOpen: (v: boolean) => void;
  cityPopoverOpen: boolean;
  setCityPopoverOpen: (v: boolean) => void;
}

export function UserFormStudentLocationFields({
  register,
  errors,
  setValue,
  isLoading,
  isBrazilSelected,
  selectedCountry,
  setSelectedCountry,
  selectedState,
  setSelectedState,
  cities,
  isLoadingCities,
  watchedCity,
  countryPopoverOpen,
  setCountryPopoverOpen,
  statePopoverOpen,
  setStatePopoverOpen,
  cityPopoverOpen,
  setCityPopoverOpen,
}: UserFormStudentLocationFieldsProps) {
  return (
    <>
      {/* País */}
      <div className="space-y-2">
        <Label htmlFor="country">País *</Label>
        <Popover open={countryPopoverOpen} onOpenChange={setCountryPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between font-normal",
                !selectedCountry && "text-muted-foreground"
              )}
              disabled={isLoading}
            >
              <span className="min-w-0 truncate">
                {selectedCountry || "Selecione o país"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder={ui.location.countryPlaceholder} />
              <CommandList>
                <CommandEmpty>{ui.location.countryEmpty}</CommandEmpty>
                <CommandGroup>
                  {COMMON_COUNTRIES.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={country.name}
                      onSelect={() => {
                        setSelectedCountry(country.name);
                        setValue("country", country.name, {
                          shouldValidate: true,
                        });
                        setSelectedState("");
                        setValue("state", "", { shouldValidate: false });
                        setValue("city", "", { shouldValidate: false });
                        setCountryPopoverOpen(false);
                      }}
                    >
                      {country.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {errors.country && (
          <p className="text-sm text-destructive">{errors.country?.message}</p>
        )}
      </div>

      {/* Estado */}
      {isBrazilSelected ? (
        <div className="space-y-2">
          <Label htmlFor="state">Estado (UF) *</Label>
          <Popover open={statePopoverOpen} onOpenChange={setStatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between font-normal",
                  !selectedState && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <span className="min-w-0 truncate">
                  {BR_STATES.find((s) => s.code === selectedState)?.name ||
                    "Selecione o estado"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder={ui.location.statePlaceholder} />
                <CommandList>
                  <CommandEmpty>{ui.location.stateEmpty}</CommandEmpty>
                  <CommandGroup>
                    {BR_STATES.map((state) => (
                      <CommandItem
                        key={state.code}
                        value={`${state.name} ${state.code}`}
                        onSelect={() => {
                          setSelectedState(state.code);
                          setValue("state", state.code, {
                            shouldValidate: true,
                          });
                          setValue("city", "", { shouldValidate: false });
                          setStatePopoverOpen(false);
                        }}
                      >
                        <span className="mr-2 text-xs opacity-50">
                          {state.code}
                        </span>
                        <span>{state.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state?.message}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="state">Estado/Região *</Label>
          <Input
            id="state"
            placeholder={ui.location.stateManualPlaceholder}
            {...register("state")}
            disabled={isLoading}
          />
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state?.message}</p>
          )}
        </div>
      )}

      {/* Cidade */}
      {isBrazilSelected ? (
        <div className="space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between font-normal",
                  !watchedCity && "text-muted-foreground"
                )}
                disabled={isLoading || !selectedState || isLoadingCities}
              >
                <span className="min-w-0 truncate">
                  {isLoadingCities
                    ? "Carregando cidades..."
                    : watchedCity || "Selecione a cidade"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder={ui.location.cityPlaceholder} />
                <CommandList>
                  <CommandEmpty>{ui.location.cityEmpty}</CommandEmpty>
                  <CommandGroup>
                    {cities.map((city) => (
                      <CommandItem
                        key={city.value}
                        value={city.label}
                        onSelect={() => {
                          setValue("city", city.value, {
                            shouldValidate: true,
                          });
                          setCityPopoverOpen(false);
                        }}
                      >
                        {city.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city?.message}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="city">Cidade *</Label>
          <Input
            id="city"
            placeholder={ui.location.cityManualPlaceholder}
            {...register("city")}
            disabled={isLoading}
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city?.message}</p>
          )}
        </div>
      )}
    </>
  );
}

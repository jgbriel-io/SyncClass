import {
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
  FieldErrors,
  FieldValues,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ui, students as studentsContent, common } from "@/content";
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
import { CaretUpDown as ChevronsUpDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { BR_STATES, type BrCityOption } from "@/lib/br-locations";
import { COMMON_COUNTRIES } from "@/lib/countries";
import { STACK } from "@/lib/design-tokens/spacing";
import { ICON_SIZES } from "@/lib/design-tokens/icon-sizes";

interface StudentLocationSectionProps {
  register: UseFormRegister<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
  watch: UseFormWatch<FieldValues>;
  errors: FieldErrors<FieldValues>;
  isLoading?: boolean;
  selectedCountry: string;
  selectedState: string;
  isBrazilSelected: boolean;
  cities: BrCityOption[];
  isLoadingCities: boolean;
  cityPopoverOpen: boolean;
  statePopoverOpen: boolean;
  countryPopoverOpen: boolean;
  onCountryChange: (country: string) => void;
  onStateChange: (state: string) => void;
  onCityPopoverChange: (open: boolean) => void;
  onStatePopoverChange: (open: boolean) => void;
  onCountryPopoverChange: (open: boolean) => void;
}

export function StudentLocationSection({
  register,
  setValue,
  watch,
  errors,
  isLoading,
  selectedCountry,
  selectedState,
  isBrazilSelected,
  cities,
  isLoadingCities,
  cityPopoverOpen,
  statePopoverOpen,
  countryPopoverOpen,
  onCountryChange,
  onStateChange,
  onCityPopoverChange,
  onStatePopoverChange,
  onCountryPopoverChange,
}: StudentLocationSectionProps) {
  const watchedCity = watch("city") || "";

  return (
    <>
      {/* País */}
      <div className={STACK.TIGHT}>
        <Label htmlFor="country">
          {studentsContent.locationSection.countryLabel}
        </Label>
        <Popover
          open={countryPopoverOpen}
          onOpenChange={onCountryPopoverChange}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={countryPopoverOpen}
              className={cn(
                "w-full justify-between font-normal",
                !selectedCountry && "text-muted-foreground"
              )}
              disabled={isLoading}
            >
              <span className="min-w-0 truncate">
                {selectedCountry ||
                  studentsContent.locationSection.selectCountry}
              </span>
              <ChevronsUpDown
                className={`ml-2 ${ICON_SIZES.SM} shrink-0 opacity-50`}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder={ui.location.countryPlaceholder} />
              <CommandList>
                <CommandEmpty>
                  {studentsContent.locationSection.noCountriesFound}
                </CommandEmpty>
                <CommandGroup>
                  {COMMON_COUNTRIES.map((country) => (
                    <CommandItem
                      key={country.code}
                      value={country.name}
                      onSelect={() => {
                        onCountryChange(country.name);
                        setValue("country", country.name, {
                          shouldValidate: true,
                        });
                        onStateChange("");
                        setValue("state", "", { shouldValidate: false });
                        setValue("city", "", { shouldValidate: false });
                        onCountryPopoverChange(false);
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
          <p className="text-sm text-destructive">
            {String(errors.country.message)}
          </p>
        )}
      </div>

      {/* Estado */}
      {isBrazilSelected ? (
        <div className={STACK.TIGHT}>
          <Label htmlFor="state">
            {studentsContent.locationSection.stateLabel}
          </Label>
          <Popover open={statePopoverOpen} onOpenChange={onStatePopoverChange}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full min-w-0 justify-between",
                  errors.state && "border-destructive"
                )}
                disabled={isLoading}
              >
                <span className="min-w-0 truncate">
                  {BR_STATES.find((s) => s.code === selectedState)?.name ||
                    studentsContent.locationSection.selectState}
                </span>
                <ChevronsUpDown
                  className={`ml-2 ${ICON_SIZES.SM} shrink-0 opacity-50`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder={ui.location.statePlaceholder} />
                <CommandList>
                  <CommandEmpty>
                    {studentsContent.locationSection.noStatesFound}
                  </CommandEmpty>
                  <CommandGroup>
                    {BR_STATES.map((state) => (
                      <CommandItem
                        key={state.code}
                        value={`${state.name} ${state.code}`}
                        onSelect={() => {
                          onStateChange(state.code);
                          setValue("state", state.code, {
                            shouldValidate: true,
                          });
                          setValue("city", "", { shouldValidate: false });
                          onStatePopoverChange(false);
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
            <p className="text-sm text-destructive">
              {String(errors.state.message)}
            </p>
          )}
        </div>
      ) : (
        <div className={STACK.TIGHT}>
          <Label htmlFor="state">
            {studentsContent.locationSection.stateManualLabel}
          </Label>
          <Input
            id="state"
            placeholder={ui.location.stateManualPlaceholder}
            {...register("state")}
            disabled={isLoading}
          />
          {errors.state && (
            <p className="text-sm text-destructive">
              {String(errors.state.message)}
            </p>
          )}
        </div>
      )}

      {/* Cidade */}
      {isBrazilSelected ? (
        <div className={STACK.TIGHT}>
          <Label htmlFor="city">
            {studentsContent.locationSection.cityLabel}
          </Label>
          <Popover open={cityPopoverOpen} onOpenChange={onCityPopoverChange}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full min-w-0 justify-between",
                  errors.city && "border-destructive"
                )}
                disabled={!selectedState || isLoading || isLoadingCities}
              >
                <span className="min-w-0 truncate">
                  {(() => {
                    const current = cities.find((c) => c.value === watchedCity);
                    if (current) return current.label;
                    if (watchedCity) return watchedCity;
                    if (isLoadingCities) return common.errors.loadingCities;
                    return selectedState
                      ? studentsContent.locationSection.selectCity
                      : studentsContent.locationSection.selectStateFirst;
                  })()}
                </span>
                <ChevronsUpDown
                  className={`ml-2 ${ICON_SIZES.SM} shrink-0 opacity-50`}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder={ui.location.cityPlaceholder} />
                <CommandList>
                  <CommandEmpty>
                    {studentsContent.locationSection.noCitiesFound}
                  </CommandEmpty>
                  <CommandGroup>
                    {cities.map((city) => (
                      <CommandItem
                        key={city.value}
                        value={city.label}
                        onSelect={() => {
                          setValue("city", city.value, {
                            shouldValidate: true,
                          });
                          onCityPopoverChange(false);
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
            <p className="text-sm text-destructive">
              {String(errors.city.message)}
            </p>
          )}
        </div>
      ) : (
        <div className={STACK.TIGHT}>
          <Label htmlFor="city">
            {studentsContent.locationSection.cityLabel}
          </Label>
          <Input
            id="city"
            placeholder={ui.location.cityManualPlaceholder}
            {...register("city")}
            disabled={isLoading}
          />
          {errors.city && (
            <p className="text-sm text-destructive">
              {String(errors.city.message)}
            </p>
          )}
        </div>
      )}
    </>
  );
}
